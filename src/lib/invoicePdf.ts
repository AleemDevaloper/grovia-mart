import { jsPDF } from 'jspdf'
import type { Order } from '../types'
import { formatOrderStatus } from './format'

const pageWidth = 210
const margin = 15
const right = pageWidth - margin

function money(value: number): string {
  return `Rs. ${Number(value).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function invoiceDate(value: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeZone: 'Asia/Karachi',
  }).format(new Date(value))
}

export function downloadOrderInvoicePdf(order: Order): void {
  const document = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageHeight = document.internal.pageSize.getHeight()
  let y = 52

  const drawTableHeader = () => {
    document.setFillColor(245, 246, 238)
    document.rect(margin, y - 5, right - margin, 10, 'F')
    document.setFont('helvetica', 'bold')
    document.setFontSize(9)
    document.setTextColor(54, 68, 57)
    document.text('ITEM', margin + 2, y + 1)
    document.text('QTY', 128, y + 1, { align: 'right' })
    document.text('UNIT PRICE', 158, y + 1, { align: 'right' })
    document.text('TOTAL', right - 2, y + 1, { align: 'right' })
    y += 12
  }

  const nextPage = () => {
    document.addPage()
    y = 20
    drawTableHeader()
  }

  document.setFillColor(30, 70, 52)
  document.rect(0, 0, pageWidth, 39, 'F')
  document.setTextColor(255, 255, 255)
  document.setFont('helvetica', 'bold')
  document.setFontSize(19)
  document.text('GROVIA MART', margin, 17)
  document.setFont('helvetica', 'normal')
  document.setFontSize(9)
  document.text('Fresh groceries, better living.', margin, 25)
  document.text('+92 308 792 3041', margin, 32)
  document.setFont('helvetica', 'bold')
  document.setFontSize(15)
  document.text('INVOICE', right, 18, { align: 'right' })
  document.setFont('helvetica', 'normal')
  document.setFontSize(9)
  document.text(order.orderNumber, right, 26, { align: 'right' })
  document.text(`Placed ${invoiceDate(order.placedAt)}`, right, 33, { align: 'right' })

  document.setTextColor(40, 45, 39)
  document.setFont('helvetica', 'bold')
  document.setFontSize(10)
  document.text('BILL TO', margin, 49)
  document.text('DELIVERY', 112, 49)
  document.setFont('helvetica', 'normal')
  document.setFontSize(9)
  document.text(document.splitTextToSize(order.recipientName, 82), margin, 56)
  document.text(document.splitTextToSize(order.phone, 82), margin, 62)
  document.text(document.splitTextToSize(order.addressLine, 82), 112, 56)
  document.text(document.splitTextToSize(`${order.area}, ${order.city}${order.postalCode ? ` ${order.postalCode}` : ''}`, 82), 112, 62)
  document.text(`Date: ${invoiceDate(`${order.deliveryDate}T12:00:00+05:00`)}`, 112, 68)
  document.text(`Time: ${order.deliverySlot}`, 112, 74)
  document.text(`Status: ${formatOrderStatus(order.status)}`, margin, 71)
  const paymentMethod = order.paymentMethod === 'cod'
    ? 'Cash on Delivery'
    : order.paymentMethod.replaceAll('_', ' ')
  document.text(`Payment: ${paymentMethod}`, margin, 77)
  y = 91
  drawTableHeader()

  document.setFont('helvetica', 'normal')
  document.setFontSize(9)
  order.items.forEach((item) => {
    const itemLines = document.splitTextToSize(`${item.productName} · ${item.unit}`, 94) as string[]
    const rowHeight = Math.max(9, itemLines.length * 4.5)

    if (y + rowHeight > pageHeight - 36) nextPage()

    document.setTextColor(40, 45, 39)
    document.text(itemLines, margin + 2, y)
    document.text(String(item.quantity), 128, y, { align: 'right' })
    document.text(money(item.unitPrice), 158, y, { align: 'right' })
    document.text(money(item.lineTotal), right - 2, y, { align: 'right' })
    y += rowHeight
    document.setDrawColor(229, 231, 222)
    document.line(margin, y - 2, right, y - 2)
  })

  if (y + 40 > pageHeight - 18) nextPage()
  y += 5

  const drawTotal = (label: string, value: string, bold = false) => {
    document.setFont('helvetica', bold ? 'bold' : 'normal')
    document.setFontSize(bold ? 11 : 9)
    document.setTextColor(40, 45, 39)
    document.text(label, 125, y)
    document.text(value, right, y, { align: 'right' })
    y += bold ? 8 : 6
  }

  drawTotal('Subtotal', money(order.subtotal))
  if (order.discount > 0) drawTotal('Discount', `- ${money(order.discount)}`)
  drawTotal('Delivery', order.deliveryFee > 0 ? money(order.deliveryFee) : 'Free')
  drawTotal('TOTAL DUE', money(order.total), true)

  document.setFont('helvetica', 'normal')
  document.setFontSize(8)
  document.setTextColor(110, 115, 107)
  document.text('Thank you for shopping with Grovia Mart.', margin, Math.min(pageHeight - 20, y + 8))
  document.text('This is a computer-generated invoice.', margin, Math.min(pageHeight - 15, y + 13))

  const pageCount = document.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    document.setPage(page)
    document.setFontSize(8)
    document.setTextColor(110, 115, 107)
    document.text(`Page ${page} of ${pageCount}`, right, pageHeight - 8, { align: 'right' })
  }

  document.save(`Grovia-${order.orderNumber}-invoice.pdf`)
}
