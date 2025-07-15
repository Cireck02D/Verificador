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
  const datosTabla = document.getElementById('datosTabla');
  const campoNombre = document.getElementById('campoNombre');
  const campoCedula = document.getElementById('campoCedula');
  const guardarBtn = document.getElementById('guardarBtn');

  let streamGlobal = null;

  // ✅ Función para dividir el nombre
function dividirNombre(nombreCompleto) {
  const partes = nombreCompleto.trim().split(/\s+/);
  
  if (partes.length === 2) {
    // Solo nombre y un apellido
    return {
      nombres: partes[0],
      apellido1: partes[1],
      apellido2: ""
    };
  } else if (partes.length === 3) {
    // Nombre, apellido paterno, apellido materno
    return {
      nombres: partes[0],
      apellido1: partes[1],
      apellido2: partes[2]
    };
  } else if (partes.length >= 4) {
    // Dos nombres + dos apellidos
    return {
      nombres: partes.slice(0, partes.length - 2).join(" "),
      apellido1: partes[partes.length - 2],
      apellido2: partes[partes.length - 1]
    };
  } else {
    // Fallback por si algo sale mal
    return {
      nombres: "",
      apellido1: "",
      apellido2: ""
    };
  }
}


  mostrarCamaraBtn.addEventListener('click', () => {
    zonaSubida.classList.add('oculto');
    accionesDiv.classList.add('oculto');
    resultadoDiv.classList.add('oculto');
    nuevoRegistroBtn.classList.add('oculto');
    camaraContenedor.classList.remove('oculto');

    if (!video.srcObject) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } })
        .then(stream => {
          streamGlobal = stream;
          video.srcObject = stream;
        })
        .catch(() => {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              streamGlobal = stream;
              video.srcObject = stream;
            })
            .catch(() => {
              mostrarResultadoError('No se pudo acceder a la cámara.');
            });
        });
    }
  });

  capturarBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const val = avg > 150 ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = val;
    }
    ctx.putImageData(imageData, 0, 0);

    const processedImage = canvas.toDataURL('image/png');
    procesarImagen(processedImage);
  });

  volverCamaraBtn.addEventListener('click', () => {
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
    datosTabla.classList.add('oculto');
  });

  botonSubir.addEventListener('click', () => {
    uploadInput.click();
  });

  uploadInput.addEventListener('change', event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => procesarImagen(e.target.result);
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
    datosTabla.classList.add('oculto');
  });

  // ✅ Bloque corregido para guardar y verificar cédula
  guardarBtn.addEventListener('click', async () => {
    const nombreFinal = campoNombre.innerText.trim();
    const cedulaFinal = campoCedula.innerText.trim();

    if (!nombreFinal || !cedulaFinal) {
      alert("⚠️ Ambos campos deben estar completos.");
      return;
    }

    try {
      const docRef = await db.collection("cedulas").add({
        nombre: nombreFinal,
        cedula: cedulaFinal,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      mensajeResultado.textContent = '⌛ Verificando cédula...';

      const partes = dividirNombre(nombreFinal);

      const resultado = await verificarCedulaDesdeServidor(
        cedulaFinal,
        partes.nombres,
        partes.apellido1,
        partes.apellido2
      );

      if (resultado.estado === "aprobada") {
        mensajeResultado.textContent = "✅ Receta verificada.";
      } else {
        mensajeResultado.textContent = "⚠️ Receta sospechosa.";
      }

      await db.collection("cedulas").doc(docRef.id).update({
        resultado: resultado.estado,
        folio: resultado.folio
      });

      nuevoRegistroBtn.classList.remove('oculto');
      datosTabla.classList.add('oculto');
    } catch (error) {
      mensajeResultado.textContent = "❌ Error durante la verificación: " + error.message;
      nuevoRegistroBtn.classList.remove('oculto');
      datosTabla.classList.add('oculto');
    }
  });

  function mostrarResultadoError(msg) {
    resultadoDiv.classList.remove('oculto');
    mensajeResultado.textContent = msg;
    nuevoRegistroBtn.classList.remove('oculto');
    zonaSubida.classList.add('oculto');
    accionesDiv.classList.add('oculto');
    camaraContenedor.classList.add('oculto');
    datosTabla.classList.add('oculto');
  }

  function extraerDatos(texto) {
    const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
    let nombre = null;
    let cedula = null;

    for (let linea of lineas) {
      const limpia = linea.replace(/[^\wÁÉÍÓÚÑáéíóúñ\s.:]/g, '').trim();

      if (!nombre && /(DRA\.|DR\.|M[ÉE]DICO)/i.test(limpia)) {
        const nombreMatch = limpia.match(/(?:DRA\.|DR\.|M[ÉE]DICO(?:\s+CIRUJANO)?(?:\s+Y\s+PARTERO)?)[\s.:\-]*([A-ZÁÉÍÓÚÑ\s]{5,})(?:[^A-ZÁÉÍÓÚÑ\s]|$)/i);
        if (nombreMatch && nombreMatch[1]) {
          const posibleNombre = nombreMatch[1]
            .replace(/\s+/g, ' ')
            .replace(/\s+[a-z]{1}$/i, '')
            .replace(/[^A-ZÁÉÍÓÚÑ\s]/gi, '')
            .trim();
          if (posibleNombre.split(/\s+/).length >= 2) {
            nombre = posibleNombre;
          }
        }
      }

      if (!cedula) {
        const cedulaMatch = limpia.match(/(?:C[ÉE]D(?:\.|ULA)?\s*PROF(?:\.|ESIONAL)?\.?:?\s*|CED\.?\s*PROF\.?\s*)(\d{7,8})/i);
        if (cedulaMatch) {
          cedula = cedulaMatch[1];
        }
      }
    }

    return { nombre, cedula };
  }

  async function procesarImagen(imageData) {
    resultadoDiv.classList.remove('oculto');
    mensajeResultado.textContent = 'Procesando imagen...';
    nuevoRegistroBtn.classList.add('oculto');
    zonaSubida.classList.add('oculto');
    accionesDiv.classList.add('oculto');
    camaraContenedor.classList.add('oculto');
    datosTabla.classList.add('oculto');

    if (streamGlobal) {
      streamGlobal.getTracks().forEach(t => t.stop());
      streamGlobal = null;
    }
    video.srcObject = null;

    try {
      const { data: { text } } = await Tesseract.recognize(imageData, 'spa', { logger: () => {} });
      const { nombre, cedula } = extraerDatos(text);

      if (nombre || cedula) {
        campoNombre.innerText = nombre || '';
        campoCedula.innerText = cedula || '';
        datosTabla.classList.remove('oculto');
        mensajeResultado.textContent = '📝 Verifica y guarda los datos extraídos.';
      } else {
        mensajeResultado.textContent = '⚠️ No se detectó nombre o cédula válidos.';
      }

      nuevoRegistroBtn.classList.remove('oculto');
    } catch {
      mensajeResultado.textContent = '❌ Error al procesar la imagen.';
      nuevoRegistroBtn.classList.remove('oculto');
    }
  }
});
