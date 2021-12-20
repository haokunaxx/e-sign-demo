/* global Pdfh5 */
export default function renderPdf(container, pdfUrl) {
  const pdf = new Pdfh5(container, {
    pdfurl: pdfUrl,
  });
  return pdf;
}
