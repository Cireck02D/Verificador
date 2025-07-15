document.addEventListener('DOMContentLoaded', () => {
  const compartirBtn = document.getElementById('compartirBtn');

  function limpiarTexto(texto) {
    if (!texto) return "";
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  compartirBtn.addEventListener('click', async () => {
    try {
      const snapshot = await db.collection("cedulas")
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        alert("❌ No se encontró ningún resultado para compartir.");
        return;
      }

      const doc = snapshot.docs[0].data();
      const resultado = limpiarTexto(doc.resultado?.toUpperCase()) || "SIN RESULTADO";
      const folio = limpiarTexto(doc.folio) || "SIN FOLIO";
      const fecha = limpiarTexto(doc.timestamp?.toDate().toLocaleString()) || "SIN FECHA";

      const pdf = new jspdf.jsPDF();

      pdf.setFont("courier");
      pdf.setFontSize(16);
      pdf.text("Resultado de Verificación de Cédula", 20, 30);
      pdf.setFontSize(12);
      pdf.text(`Folio: ${folio}`, 20, 50);
      pdf.text(`Fecha: ${fecha}`, 20, 60);
      pdf.text(`Resultado: ${resultado}`, 20, 70);

      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], "verificacion.pdf", { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: "Verificación de Cédula",
          text: `Aquí está el resultado de la verificación:\nFolio: ${folio}\nResultado: ${resultado}`,
          files: [pdfFile]
        });
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "verificacion.pdf";
        a.click();
        URL.revokeObjectURL(url);
        alert("✅ PDF generado. Tu navegador no permite compartir, pero se descargó el archivo.");
      }
    } catch (error) {
      console.error("Error al compartir PDF:", error);
      alert("❌ Error al generar o compartir el PDF: " + error.message);
    }
  });
});
 
