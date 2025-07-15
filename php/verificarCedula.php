<?php
header('Content-Type: application/json');

if (!isset($_POST['nombres']) || !isset($_POST['apellido1']) || !isset($_POST['apellido2']) || !isset($_POST['cedula'])) {
    echo json_encode(['error' => 'Faltan datos.']);
    exit;
}

$nombres = strtoupper(trim($_POST['nombres']));
$apellido1 = strtoupper(trim($_POST['apellido1']));
$apellido2 = strtoupper(trim($_POST['apellido2']));
$cedulaOCR = trim($_POST['cedula']);

// Inicia cURL
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "https://www.cedulaprofesional.sep.gob.mx/cedula/presidencia/indexAvanzada.action",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_USERAGENT => "Mozilla/5.0",
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'nombre' => $nombres,
        'primerApellido' => $apellido1,
        'segundoApellido' => $apellido2
    ])
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || !$response) {
    echo json_encode(['error' => 'No se pudo consultar el sitio de la SEP.']);
    exit;
}

// Extrae cédula y nombre del resultado
$encontrada = preg_match('/<td>(\d{7,8})<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>/is', $response, $matches);

if ($encontrada) {
    $cedula_encontrada = $matches[1];
    $nombre_encontrado = trim($matches[2] . ' ' . $matches[3] . ' ' . $matches[4]);

    echo json_encode([
        'cedula_encontrada' => $cedula_encontrada,
        'nombre_encontrado' => strtoupper($nombre_encontrado)
    ]);
} else {
    echo json_encode([
        'cedula_encontrada' => null,
        'nombre_encontrado' => null
    ]);
}
