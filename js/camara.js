document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('video');
  const capturarBtn = document.getElementById('capturar');
  const volverCamaraBtn = document.getElementById('volverCamara');
  const resultadoDiv = document.getElementById('resultado');
  const mensajeResultado = document.getElementById('mensajeResultado');
  const mostrarCamaraBtn = document.getElementById('mostrarCamara');
  const camaraContenedor = document.getElementById('camara-contenedor');
  const uploadInput = document.getElementById('uploadInput');
  const zonaSubida = document.getElementById('zona-subida');
  const botonSubir = document.getElementById('boton-subir');
  const nuevoRegistroBtn = document.getElementById('nuevoRegistro');
  const accionesDiv = document.getElementById('acciones');

  let streamGlobal = null; // Para detener cámara al volver

  mostrarCamaraBtn.addEventListener('click', () => {
    zonaSubida.classList.add('oculto');
    accionesDiv.classList.add('oculto');
    resultadoDiv.classList.add('oculto');
    nuevoRegistroBtn.classList.add('oculto');
    camaraContenedor.classList.remove('oculto');

    if (!video.srcObject) {
      // Intentar abrir cámara trasera
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } })
        .then((stream) => {
          streamGlobal = stream;
          video.srcObject = stream;
        })
        .catch(() => {
          // Si no funciona, abrir cámara frontal como fallback
          navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
              streamGlobal = stream;
              video.srcObject = stream;
            })
            .catch((err) => {
              console.error('Error al acceder a la cámara: ', err);
              mostrarResultadoError('No se pudo acceder a la cámara.');
            });
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

  volverCamaraBtn.addEventListener('click', () => {
    // Detener cámara si está activa
    if (streamGlobal) {
      streamGlobal.getTracks().forEach(track => track.stop());
      streamGlobal = null;
    }
    video.srcObject = null;

    camaraContenedor.classList.add('oculto');
    zonaSubida.classList.remove('oculto');
    accionesDiv.classList.remove('oculto');
    resultadoDiv.classList.add('oculto');
    nuevoRegistroBtn.classList.add('oculto');
    mensajeResultado.textContent = '';
    uploadInput.value = '';
  });

  botonSubir.addEventListener('click', () => {
    uploadInput.click();
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

  nuevoRegistroBtn.addEventListener('click', () => {
    zonaSubida.classList.remove('oculto');
    accionesDiv.classList.remove('oculto');
    camaraContenedor.classList.add('oculto');
    resultadoDiv.classList.add('oculto');
    nuevoRegistroBtn.classList.add('oculto');
    mensajeResultado.textContent = '';
    uploadInput.value = '';
  });

  function mostrarResultadoError(mensaje) {
    resultadoDiv.classList.remove('oculto');
    mensajeResultado.textContent = mensaje;
    nuevoRegistroBtn.classList.remove('oculto');
    zonaSubida.classList.add('oculto');
    accionesDiv.classList.add('oculto');
    camaraContenedor.classList.add('oculto');
  }

  async function procesarImagen(imageData) {
    resultadoDiv.classList.remove('oculto');
    mensajeResultado.textContent = 'Procesando imagen...';
    nuevoRegistroBtn.classList.add('oculto');
    zonaSubida.classList.add('oculto');
    accionesDiv.classList.add('oculto');
    camaraContenedor.classList.add('oculto');

    // Detener cámara si está activa (por si vino de captura)
    if (streamGlobal) {
      streamGlobal.getTracks().forEach(track => track.stop());
      streamGlobal = null;
    }
    video.srcObject = null;

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
        mensajeResultado.textContent = `✅ La cédula ${cedula} se guardó.`;

        try {
          await db.collection("cedulas").add({
            cedula: cedula,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log("Cédula guardada en Firestore");
        } catch (error) {
          console.error("Error al guardar en Firestore:", error);
          mensajeResultado.textContent = '❌ Error al guardar la cédula.';
        }

        nuevoRegistroBtn.classList.remove('oculto');
      } else {
        mensajeResultado.textContent = '⚠️ No se encontró la cédula profesional.';
        nuevoRegistroBtn.classList.remove('oculto');
      }
    }).catch((err) => {
      console.error('Error al procesar la imagen: ', err);
      mostrarResultadoError('❌ Error al procesar la imagen.');
    });
  }
});
