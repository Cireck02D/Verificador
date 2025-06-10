const video = document.getElementById('video');
const capturarBtn = document.getElementById('capturar');
const resultadoDiv = document.getElementById('resultado');
const mostrarCamaraBtn = document.getElementById('mostrarCamara');
const camaraContenedor = document.getElementById('camara-contenedor');
const uploadInput = document.getElementById('uploadInput');
const encabezado = document.getElementById('encabezado');
const zonaSubida = document.getElementById('zona-subida');

// Mostrar la cámara al hacer clic y ocultar otros elementos
mostrarCamaraBtn.addEventListener('click', () => {
  encabezado.classList.add('oculto');
  zonaSubida.classList.add('oculto');
  mostrarCamaraBtn.classList.add('oculto');
  camaraContenedor.classList.remove('oculto');

  // Iniciar la cámara si no está activa
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
    reader.onload = function(e) {
      procesarImagen(e.target.result);
    };
    reader.readAsDataURL(file);
  }
});

function procesarImagen(imageData) {
  resultadoDiv.style.display = 'block';
  resultadoDiv.textContent = 'Procesando imagen...';

  Tesseract.recognize(
    imageData,
    'spa',
    { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {
    console.log('Texto extraído:', text);
    const cedulaRegex = /\b\d{8}\b/g;
    const cedula = text.match(cedulaRegex);

    if (cedula) {
      resultadoDiv.textContent = `✅ Cédula profesional encontrada: ${cedula[0]}`;
    } else {
      resultadoDiv.textContent = '⚠️ No se encontró la cédula profesional.';
    }
  }).catch((err) => {
    console.error('Error al procesar la imagen: ', err);
    resultadoDiv.textContent = '❌ Error al procesar la imagen.';
  });
}
