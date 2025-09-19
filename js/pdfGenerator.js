import { getDB } from './state.js';

export function generatePDF(reqData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const database = getDB();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    const nup = reqData.nup || "_________________________";
    const assuntoDfd = `Requisição Nº ${String(reqData.numero).padStart(2, '0')} /2025`;
    const dataEmissao = new Date(reqData.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase().replace(/ DE /g, ' ').replace('.', '');
    const localData = `Rio Branco-AC, ${dataEmissao}`; // Corrigido para hífen
    const interessado = reqData.setorRequisitante;
    const assuntoAquisicao = database[reqData.pregaoId].objeto;
    const anexos = reqData.anexos;
    
    const drawTextBox = (x, y, width, height, textLines, options = {}) => {
        const { fontSize = 8, fontStyle = 'normal', textAlign = 'center', hasInnerLines = false } = options;
        doc.setDrawColor(0, 0, 0);
        doc.rect(x, y, width, height);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const textX = textAlign === 'center' ? x + (width / 2) : x + 2;
        let textY = y + 5;
        textLines.forEach(line => {
            doc.text(line, textX, textY, { align: textAlign });
            textY += 4;
        });
        if (hasInnerLines) {
            let lineY = y + 7;
            while(lineY < y + height - 2) {
                doc.setDrawColor(200, 200, 200);
                doc.line(x + 1, lineY, x + width - 1, lineY);
                lineY += 4;
            }
        }
    };

    const topY = 20;
    const boxHeight = 28;
    drawTextBox(margin, topY, 60, boxHeight, ["NUP:", nup], { fontSize: 10, textAlign: 'left', hasInnerLines: true });
    drawTextBox(margin + 62, topY, 66, boxHeight, ["MINISTÉRIO DA DEFESA", "EXÉRCITO BRASILEIRO", "COMANDO DE FRONTEIRA ACRE", "4º BATALHÃO DE INFANTARIA DE SELVA", "(4ª Companhia de Fronteira/1956)", "(BATALHÃO PLÁCIDO DE CASTRO)"], { fontSize: 7.5, fontStyle: 'bold' });
    drawTextBox(margin + 130, topY, 50, boxHeight, ["ASSUNTO:", assuntoDfd, localData], { fontSize: 9, textAlign: 'left', hasInnerLines: true });
    
    const titleY = topY + boxHeight + 25;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Cmdo Fron AC/4º BIS", pageWidth / 2, titleY, { align: 'center' });
    
    const detailsY = titleY + 15;
    const cornerRadius = 2;
    const innerBoxHeight = 10;
    const spacing = 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setLineWidth(0.2);
    let currentY = detailsY;
    doc.roundedRect(margin, currentY, contentWidth, innerBoxHeight, cornerRadius, cornerRadius);
    doc.text(`INTERESSADO: ${interessado}`, margin + 2, currentY + 6);
    currentY += innerBoxHeight + spacing;
    doc.roundedRect(margin, currentY, contentWidth, innerBoxHeight, cornerRadius, cornerRadius);
    doc.text(`ASSUNTO: ${assuntoAquisicao}`, margin + 2, currentY + 6);
    currentY += innerBoxHeight + spacing;
    doc.roundedRect(margin, currentY, contentWidth, innerBoxHeight, cornerRadius, cornerRadius);
    doc.text(`ANEXO: ${anexos}`, margin + 2, currentY + 6);
    
    const salcY = 250;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Preenchimento a cargo da SALC", margin, salcY);
    doc.text("UG (  ) 160002 (  ) 167002", margin, salcY + 5);
    doc.text("2025NE _________________", margin, salcY + 10);
    doc.text("VALOR: R$_________________", margin, salcY + 15);
    doc.text("PREGÃO SRP: _________________ UGG _________________", margin, salcY + 20);
    
    doc.addPage();
    
    currentY = 20;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Requisição N ${String(reqData.numero).padStart(3, '0')}/ 2025`, margin, currentY);
    doc.text(`NUP: ${reqData.nup || 'Não informado'}`, pageWidth - margin, currentY, { align: 'right' });
    
    currentY += 10;
    const lineSpacing = 6;
    const detailBlockY = currentY;
    const fields = [
        { label: 'Setor/Seção Requisitante:', value: reqData.setorRequisitante },
        { label: 'Responsável pela demanda:', value: reqData.responsavel },
        { label: 'Destino Material:', value: reqData.destino },
        { label: 'E-mail:', value: reqData.email },
    ];
    const fieldsCol2 = [
        { label: 'Data:', value: new Date(reqData.data).toLocaleDateString('pt-BR') },
        { label: 'Identidade:', value: reqData.identidade },
        { label: 'RITEX: / Telefone:', value: reqData.contato },
    ]
    const detailBlockHeight = (fields.length * lineSpacing) + 2;
    doc.setLineWidth(0.2);
    doc.rect(margin, detailBlockY, contentWidth, detailBlockHeight);
    doc.setFontSize(9);
    let tempY = detailBlockY + 4;
    for(let i=0; i < fields.length; i++) {
        if (i > 0) {
            doc.setDrawColor(200);
            doc.line(margin, tempY - 2, pageWidth - margin, tempY - 2);
        }
        const field1 = fields[i];
        doc.setFont('helvetica', 'bold'); doc.text(field1.label, margin + 1, tempY);
        doc.setFont('helvetica', 'normal'); doc.text(field1.value || '-', margin + 50, tempY);
        if (fieldsCol2[i]) {
            const field2 = fieldsCol2[i];
            // ====== CORREÇÃO DE ALINHAMENTO APLICADA AQUI ======
            doc.setFont('helvetica', 'bold'); doc.text(field2.label, margin + 105, tempY);
            doc.setFont('helvetica', 'normal'); doc.text(field2.value || '-', margin + 135, tempY);
        }
        tempY += lineSpacing;
    }
    
    currentY = detailBlockY + detailBlockHeight + 5;
    const licitacaoBlockHeight = 40;
    doc.rect(margin, currentY, contentWidth, licitacaoBlockHeight);
    let licitacaoY = currentY + 5;
    doc.setFont('helvetica', 'bold'); doc.text('Modalidade de Licitação:', margin + 2, licitacaoY);
    licitacaoY += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`( x ) Pregão do 4º BIS   ${reqData.pregaoId}`, margin + 2, licitacaoY);
    licitacaoY += 5; doc.text('(   ) Prego de UG Participante ______________', margin + 2, licitacaoY);
    licitacaoY += 5; doc.text('(   ) Prego de UG Não Participante (Carona)', margin + 2, licitacaoY);
    licitacaoY += 5; doc.text('(   ) Inexigibilidade de licitação', margin + 2, licitacaoY);
    licitacaoY += 5; doc.text('(   ) Dispensa de licitação', margin + 2, licitacaoY);
    licitacaoY += 5; doc.text('(   ) Contrato n ______________', margin + 2, licitacaoY);
    
    currentY += licitacaoBlockHeight + 5;
    const empenhoBlockHeight = 10;
    doc.rect(margin, currentY, contentWidth, empenhoBlockHeight);
    let empenhoY = currentY + 6;
    doc.setFont('helvetica', 'bold'); doc.text('Tipo de empenho:', margin + 2, empenhoY);
    doc.setFont('helvetica', 'normal');
    const tipoEmpenho = reqData.tipoEmpenho || 'Ordinário';
    const ordinarioMark = tipoEmpenho === 'Ordinário' ? '(x)' : '( )';
    const globalMark = tipoEmpenho === 'Global' ? '(x)' : '( )';
    const estimativoMark = tipoEmpenho === 'Estimativo' ? '(x)' : '( )';
    doc.text(`${ordinarioMark} Ordinário`, margin + 40, empenhoY);
    doc.text(`${globalMark} Global`, margin + 80, empenhoY);
    doc.text(`${estimativoMark} Estimativo`, margin + 120, empenhoY);
    
    currentY += empenhoBlockHeight + 5;
    doc.setFont('helvetica', 'bold'); doc.text('1. Justificativa da necessidade da contratação da solução, considerando o Planejamento Estratégico (Plano de Gestão da OM)', margin, currentY);
    currentY += 5;
    const justificationText = doc.splitTextToSize(reqData.justificativa || 'Nenhuma justificativa fornecida.', contentWidth - 4);
    const justHeight = (justificationText.length * 4) + 4;
    doc.rect(margin, currentY, contentWidth, justHeight);
    doc.setFont('helvetica', 'normal');
    doc.text(justificationText, margin + 2, currentY + 4);
    
    currentY += justHeight + 10;
    doc.setFont('helvetica', 'bold'); doc.text('3. Créditos Orçamentários:', margin, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`3.1 Nota de Movimentação de Crédito: ${reqData.notaCredito || 'Não informado'}`, margin, currentY);
    currentY += 5;
    doc.text(`3.2 Valor estimado da contratação: R$ ${reqData.valorTotal.toFixed(2).replace('.', ',')}`, margin, currentY);
    currentY += 5;
    doc.text(`3.5 Plano Interno (PI): ${reqData.planoInterno || 'Não informado'}`, margin, currentY);
    currentY += 5;
    doc.text(`3.6 Plano de Trabalho Resumido (PTRES): ${reqData.ptres || 'Não informado'}`, margin, currentY);
    
    currentY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`CNPJ: ${reqData.fornecedorData.cnpj} - ${reqData.fornecedorData.nome}`, margin, currentY);
    currentY += 5;
    
    const tableBody = [];
    for (const itemId in reqData.selectedItems) {
        const quantidade = reqData.selectedItems[itemId];
        const itemData = database[reqData.pregaoId].fornecedores
            .find(f => f.id === reqData.fornecedorData.id)
            .itens.find(i => i.id === itemId);
        if (itemData && quantidade > 0) {
            const valorTotalItem = itemData.valor * quantidade;
            tableBody.push([
                itemData.numeroItem,
                `${itemData.descricao}${itemData.marca ? `\nMarca: ${itemData.marca}`: ''}`,
                itemData.unidade,
                quantidade,
                `R$ ${itemData.valor.toFixed(2).replace('.', ',')}`,
                `R$ ${valorTotalItem.toFixed(2).replace('.', ',')}`
            ]);
        }
    }

    doc.autoTable({
        startY: currentY,
        head: [['Item', 'Descrição Detalhada', 'UN', 'QTD', 'Valor Unitário', 'Valor Final']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold', halign: 'center', fontSize: 8 },
        bodyStyles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 1: { cellWidth: 88 }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right' }, },
        foot: [[ { content: 'VALOR TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `R$ ${reqData.valorTotal.toFixed(2).replace('.', ',')}`, styles: { halign: 'right', fontStyle: 'bold' } } ]],
        footStyles: { fillColor: [230, 230, 230], textColor: 0, },
        didDrawPage: (data) => { currentY = data.cursor.y; }
    });

    currentY += 10;
    if (currentY > pageHeight - 120) { doc.addPage(); currentY = 20; }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rio Branco-AC, ${new Date(reqData.data).toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', year: 'numeric'})}.`, pageWidth / 2, currentY, { align: 'center'});
    
    currentY += 15;
    doc.line(margin + 45, currentY, pageWidth - margin - 45, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(reqData.responsavel.toUpperCase() || 'NOME DO RESPONSÁVEL', pageWidth / 2, currentY, { align: 'center'});
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.text('Encarregado do Setor de Material', pageWidth / 2, currentY, { align: 'center'});
    
    currentY += 15;
    const halfContentWidth = (contentWidth / 2) - 1;
    const signatureBoxHeight = 35;
    if (currentY > pageHeight - 85) { doc.addPage(); currentY = 20; }
    const despachoY = currentY;
    
    doc.rect(margin, despachoY, halfContentWidth, signatureBoxHeight);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('DESPACHO DO FISCAL ADMINISTRATIVO', margin + halfContentWidth / 2, despachoY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('O referido material/serviço necessita ser adquirido.', margin + 13, despachoY + 12);
    // ====== CORREÇÃO DA DATA DO FISCAL ======
    doc.text(`Rio Branco-AC, ___ de ${new Date(reqData.data).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}.`, margin + halfContentWidth / 2, despachoY + 17, { align: 'center' });

    let signatureY = despachoY + signatureBoxHeight - 9;
    doc.line(margin + 10, signatureY, margin + halfContentWidth - 5, signatureY );
    signatureY += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(reqData.fiscalAdm?.toUpperCase() || '', margin + halfContentWidth / 2, signatureY, { align: 'center' });
    signatureY += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(reqData.fiscalAdmFunc || '', margin + halfContentWidth / 2, signatureY, { align: 'center' });
    
    doc.rect(margin + halfContentWidth + 2, despachoY, halfContentWidth, signatureBoxHeight);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('DESPACHO DO CONFORMADOR', margin + halfContentWidth + 2 + halfContentWidth / 2, despachoY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('Documentação sem alteração.', margin + halfContentWidth + 26, despachoY + 12);
    // ====== CORREÇÃO DA DATA DO CONFORMADOR ======
    doc.text(`Rio Branco-AC, ___ de ${new Date(reqData.data).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}.`, margin + halfContentWidth + 2 + halfContentWidth / 2, despachoY + 17, { align: 'center' });

    signatureY = despachoY + signatureBoxHeight - 8;
    doc.line(margin + halfContentWidth + 7, signatureY, pageWidth - margin - 5, signatureY);
    signatureY += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(reqData.conformador.toUpperCase() || '', margin + halfContentWidth + 2 + halfContentWidth / 2, signatureY, {align: 'center'});
    signatureY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(reqData.conformadorFunc || '', margin + halfContentWidth + 2 + halfContentWidth / 2, signatureY, {align: 'center'});
    
    currentY += signatureBoxHeight + 5;
    if (currentY > pageHeight - 50) { doc.addPage(); currentY = 20; }
    
    doc.rect(margin, currentY, contentWidth, signatureBoxHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DESPACHO DO ORDENADOR DE DESPESAS', pageWidth / 2, currentY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const ordenadorText = doc.splitTextToSize('Autorizo o início dos procedimentos licitatórios e determino a abertura do processo correspondente. O Chefe da Seção de Aquisições, Licitações e Contratos (SALC) adote as providências cabíveis conforme a legislação.', contentWidth - 4);
    doc.text(ordenadorText, margin + 2, currentY + 10);
    // ====== CORREÇÃO DA DATA DO ORDENADOR ======
    doc.text(`Rio Branco-AC, ___ de ${new Date(reqData.data).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}.`, pageWidth / 2, currentY + 20, { align: 'center' });

    let ordenadorSignatureY = currentY + signatureBoxHeight - 8;
    doc.line(margin + 45, ordenadorSignatureY, pageWidth - margin - 45, ordenadorSignatureY);
    ordenadorSignatureY += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(reqData.ordenador.toUpperCase() || '', pageWidth/2, ordenadorSignatureY, {align: 'center'});
    ordenadorSignatureY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(reqData.ordenadorFunc || '', pageWidth/2, ordenadorSignatureY, {align: 'center'});
    
    doc.save(`Requisicao_${String(reqData.numero).padStart(4, '0')}.pdf`);
}