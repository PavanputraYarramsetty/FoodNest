import jsPDF from 'jspdf';

/**
 * Generates and downloads a professional restaurant-style invoice PDF.
 * Uses jsPDF directly for precise control over the bill layout.
 */
const generateInvoice = async (order, user) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200] // Thermal receipt width (80mm), will auto-extend height
  });

  const pageWidth = 80;
  const margin = 5;
  const contentWidth = pageWidth - margin * 2;
  let y = 8;

  // Helper functions
  const centerText = (text, yPos, fontSize = 8, style = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, yPos);
  };

  const leftText = (text, yPos, fontSize = 7, style = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, margin, yPos);
  };

  const rightText = (text, yPos, fontSize = 7, style = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, pageWidth - margin - textWidth, yPos);
  };

  const drawDashedLine = (yPos) => {
    doc.setDrawColor(100, 100, 100);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    doc.setLineDashPattern([], 0);
  };

  const drawSolidLine = (yPos) => {
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

  // =============================================
  // HEADER: Logo + Canteen Name
  // =============================================
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
      logoImg.src = '/favicon.jpg';
    });
    const logoSize = 14;
    doc.addImage(logoImg, 'JPEG', (pageWidth - logoSize) / 2, y, logoSize, logoSize);
    y += logoSize + 2;
  } catch {
    // If logo fails to load, just skip it
    y += 2;
  }

  // Canteen name
  doc.setTextColor(30, 30, 30);
  centerText('AparnaCanteen', y, 14, 'bold');
  y += 5;

  // Tagline
  doc.setTextColor(100, 100, 100);
  centerText('Campus Dining Made Delicious', y, 6, 'italic');
  y += 4;

  drawSolidLine(y);
  y += 3;

  // =============================================
  // INVOICE TITLE
  // =============================================
  doc.setTextColor(30, 30, 30);
  centerText('TAX INVOICE', y, 10, 'bold');
  y += 5;

  drawDashedLine(y);
  y += 4;

  // =============================================
  // PAYMENT METHOD
  // =============================================
  const paymentMethod = order.payment_method || 'COD';
  const paymentLabel = paymentMethod === 'COD' ? 'Cash On Delivery' : paymentMethod;
  
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, y - 2.5, contentWidth, 7, 1, 1, 'F');
  doc.setTextColor(30, 30, 30);
  centerText(`Payment: ${paymentLabel}`, y + 1.5, 7, 'bold');
  y += 8;

  // =============================================
  // ORDER INFO
  // =============================================
  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Generate invoice number from order data
  const invoiceNum = `INV-${order.order_number || '0'}-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}`;

  doc.setTextColor(60, 60, 60);
  
  leftText(`Order #${order.order_number}`, y, 7, 'bold');
  rightText(formattedDate, y, 6);
  y += 4;

  leftText(`Invoice: ${invoiceNum}`, y, 6);
  rightText(formattedTime, y, 6);
  y += 4;

  leftText(`Order ID: ${order.id.substring(0, 8).toUpperCase()}`, y, 6);
  y += 4;

  drawDashedLine(y);
  y += 4;

  // =============================================
  // CUSTOMER DETAILS
  // =============================================
  doc.setTextColor(30, 30, 30);
  leftText('CUSTOMER DETAILS', y, 7, 'bold');
  y += 4;

  doc.setTextColor(60, 60, 60);
  leftText(`Name: ${user?.name || 'Customer'}`, y, 7);
  y += 4;
  leftText(`Phone: ${user?.phone || 'N/A'}`, y, 7);
  y += 4;

  drawDashedLine(y);
  y += 4;

  // =============================================
  // ITEMS TABLE HEADER
  // =============================================
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');

  // Column positions
  const col = {
    sno: margin,
    item: margin + 6,
    qty: margin + 43,
    price: margin + 52,
    amount: margin + 62
  };

  doc.text('S#', col.sno, y);
  doc.text('Item', col.item, y);
  doc.text('Qty', col.qty, y);
  doc.text('Price', col.price, y);
  doc.text('Amt', col.amount, y);
  y += 2;

  drawSolidLine(y);
  y += 3;

  // =============================================
  // ITEMS LIST
  // =============================================
  const items = order.order_items || [];
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  items.forEach((item, idx) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    
    doc.setFontSize(6);
    doc.text(`${idx + 1}`, col.sno, y);
    
    // Truncate long item names
    let itemName = item.item_name || 'Item';
    const maxNameWidth = 35;
    while (doc.getTextWidth(itemName) > maxNameWidth && itemName.length > 3) {
      itemName = itemName.slice(0, -1);
    }
    if (itemName !== item.item_name) itemName += '..';
    
    doc.text(itemName, col.item, y);
    doc.text(`${item.quantity}`, col.qty, y);
    doc.text(`${Number(item.price).toFixed(0)}`, col.price, y);
    doc.text(`${itemTotal}`, col.amount, y);
    y += 4;
  });

  y += 1;
  drawSolidLine(y);
  y += 4;

  // =============================================
  // TOTALS
  // =============================================
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(7);

  // Subtotal
  doc.setFont('helvetica', 'normal');
  leftText('Subtotal:', y, 7);
  rightText(`₹${Number(order.total_amount).toFixed(2)}`, y, 7);
  y += 4;

  drawDashedLine(y);
  y += 4;

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL:', margin, y);
  const totalText = `₹${Number(order.total_amount).toFixed(2)}`;
  const totalTextWidth = doc.getTextWidth(totalText);
  doc.text(totalText, pageWidth - margin - totalTextWidth, y);
  y += 3;

  drawSolidLine(y);
  y += 6;

  // =============================================
  // STATUS
  // =============================================
  const statusColors = {
    'Pending': [230, 160, 30],
    'Preparing': [50, 130, 220],
    'Completed': [40, 167, 69],
    'Cancelled': [220, 53, 69]
  };
  const statusColor = statusColors[order.status] || [100, 100, 100];
  doc.setTextColor(...statusColor);
  centerText(`Status: ${order.status}`, y, 8, 'bold');
  y += 6;

  // =============================================
  // FOOTER
  // =============================================
  drawDashedLine(y);
  y += 4;

  doc.setTextColor(80, 80, 80);
  centerText('Thank You for ordering!', y, 8, 'bold');
  y += 4;
  doc.setTextColor(120, 120, 120);
  centerText('We hope you enjoyed your meal.', y, 6, 'italic');
  y += 3.5;
  centerText('Visit again soon!', y, 6, 'italic');
  y += 5;

  drawDashedLine(y);
  y += 3;

  doc.setTextColor(150, 150, 150);
  centerText('Powered by FoodNest', y, 5);
  y += 3;
  centerText(`Generated: ${new Date().toLocaleString('en-IN')}`, y, 4);

  // =============================================
  // Resize page to fit content
  // =============================================
  const finalHeight = y + 5;
  doc.internal.pageSize.height = finalHeight;

  // Download
  const fileName = `AparnaCanteen_Invoice_${order.order_number || 'order'}.pdf`;
  doc.save(fileName);
};

export default generateInvoice;
