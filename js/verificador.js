//https://verificador-backend-production.up.railway.app/verificar//
//http://localhost:3000/verificar//
async function verificarCedulaDesdeServidor(cedula, nombres, apellido1, apellido2) {
  const response = await fetch("https://verificador-backend-production.up.railway.app/verificar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      nombres,
      apellido1,
      apellido2
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  const nombreEncontrado = data.nombre_encontrado?.toUpperCase().trim() || "";
  const cedulaEncontrada = data.cedula_encontrada?.trim() || "";
  const cedulaOCR = cedula.trim();

  const coincide = cedulaEncontrada === cedulaOCR;

  const folio = generarFolio();

  return {
    estado: coincide ? "aprobada" : "sospechosa",
    folio: folio
  };
}


function generarFolio() {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  let folio = "";
  for (let i = 0; i < 4; i++) folio += letras.charAt(Math.floor(Math.random() * letras.length));
  for (let i = 0; i < 4; i++) folio += nums.charAt(Math.floor(Math.random() * nums.length));
  return folio;
}
