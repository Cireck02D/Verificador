document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('video');
  const capturarBtn = document.getElementById('capturar');
  const resultadoDiv = document.getElementById('resultado');
  const mostrarCamaraBtn = document.getElementById('mostrarCamara');
  const camaraContenedor = document.getElementById('camara-contenedor');
  const uploadInput = document.getElementById('uploadInput');
  const encabezado = document.getElementById('encabezado');
  const zonaSubida = document.getElementById('zona-subida');
  const botonSubir = document.getElementById('boton-subir');

  mostrarCamaraBtn.addEventListener('click', () => {
    encabezado.classList.add('oculto');
    zonaSubida.classList.add('oculto');
    mostrarCamaraBtn.classList.add('oculto');
    camaraContenedor.classList.remove('oculto');

    if (!video.srcObject) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          video.srcObject = stream;
        })
        .catch((err) => {
          console.error('Error al acceder a la cámara: ', err);
          resultadoDiv.textContent = 'No se pudo acceder a la cámara.';
          resultadoDiv.style.display = 'block';
        });
    }
  });

  capturarBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/png');
    procesarImagen(imageData);
  });

  uploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        procesarImagen(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  botonSubir.addEventListener('click', () => {
    uploadInput.click();
  });

  async function procesarImagen(imageData) {
    resultadoDiv.style.display = 'block';
    resultadoDiv.textContent = 'Procesando imagen...';

    Tesseract.recognize(
      imageData,
      'spa',
      { logger: m => console.log(m) }
    ).then(async ({ data: { text } }) => {
      console.log('Texto extraído:', text);

      const cedulaRegex = /\b\d{7,8}\b/g;
      const coincidencias = text.match(cedulaRegex);

      if (coincidencias && coincidencias.length > 0) {
        const cedula = coincidencias[0];
        resultadoDiv.textContent = `✅ La cédula ${cedula} se guardó.`;

        try {
          await db.collection("cedulas").add({
            cedula: cedula,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log("Cédula guardada en Firestore");
        } catch (error) {
          console.error("Error al guardar en Firestore:", error);
          resultadoDiv.textContent = '❌ Error al guardar la cédula.';
        }
      } else {
        resultadoDiv.textContent = '⚠️ No se encontró la cédula profesional.';
      }
    }).catch((err) => {
      console.error('Error al procesar la imagen: ', err);
      resultadoDiv.textContent = '❌ Error al procesar la imagen.';
    });
  }
});
