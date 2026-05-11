import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function downloadCertificatePdf(opts: {
  verificationId: string
  playerName: string
  caseId: string
  scenario: string
  difficulty: string
  actor: string
  vector: string
  score: number
  grade: string
  breakdown: Record<string, number>
  mitre: string[]
  element: HTMLElement
  filename: string
}): Promise<{ verificationId: string }> {
  const canvas = await html2canvas(opts.element, {
    scale: 2,
    backgroundColor: '#060a12',
    useCORS: true,
  })
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  pdf.addImage(img, 'PNG', 0, 0, pageW, pageH, undefined, 'FAST')

  /* Auto-fit player name as overlay vector text. We hide the HTML name behind
   * a low-contrast underlayer and overlay precisely-sized vector text so very
   * long names never overflow. */
  const maxWidth = pageW * 0.7
  let fontSize = 36
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(fontSize)
  while (pdf.getTextWidth(opts.playerName) > maxWidth && fontSize > 14) {
    fontSize -= 2
    pdf.setFontSize(fontSize)
  }
  /* Position roughly where the HTML name was (centered, ~38% down).
   * The HTML name is also drawn so this overlay is visually consistent. */
  pdf.text(opts.playerName, pageW / 2, pageH * 0.41, { align: 'center' })

  pdf.save(opts.filename)
  return { verificationId: opts.verificationId }
}
