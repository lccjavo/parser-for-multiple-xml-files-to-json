// parser.js

// -------------------- Globals --------------------
var jsonObjects     = [];
var granSubTotal    = 0;
var granSubTotalIva = 0;
var granTotal       = 0;
var insertedKeys    = [];
var fileNames       = [];

// -------------------- Init & File Picker --------------------
$(document).ready(function() {
  $('#fileXML').on('change', handleFileSelection);
});

function handleFileSelection() {
  cleanEverything();
  showLoading();

  var files       = Array.from(document.getElementById('fileXML').files);
  var loadedCount = 0;

  files.forEach(function(file, idx) {
    var reader = new FileReader();

    reader.onload = function(e) {
      parseTextAsXml(e.target.result);
      fileNames.push(file.name);

      loadedCount++;
      if (loadedCount === files.length) {
        generateTable();
      }
    };

    reader.onerror = function() {
      console.error('Error leyendo', file.name);
      loadedCount++;
      if (loadedCount === files.length) generateTable();
    };

    reader.readAsText(file);
  });
}

// -------------------- XML → JSON --------------------
function parseTextAsXml(text) {
  var rawJson = null;

  // 1) intenta jQuery xml2json
  try {
    if ($.xml2json) {
      rawJson = $.xml2json($.parseXML(text));
    }
  } catch(e) {
    rawJson = null;
  }

  // 2) fallback a X2JS si está disponible
  if (!rawJson && typeof X2JS === 'function') {
    var x2js = new X2JS();
    if (typeof x2js.xml_str2json === 'function') {
      rawJson = x2js.xml_str2json(text);
    } else if (typeof x2js.xml2json === 'function') {
      rawJson = x2js.xml2json($.parseXML(text));
    }
  }

  if (!rawJson) {
    console.error("No se pudo convertir XML→JSON. Revisa tu xml2json/X2JS.");
    return;
  }

  // Normalize namespace vs no-namespace
  var comp = rawJson['cfdi:Comprobante'] || rawJson['Comprobante'];
  if (!comp) {
    console.error("No <Comprobante> encontrado en el JSON resultante:", rawJson);
    return;
  }

  jsonObjects.push({ Comprobante: comp });
}

// -------------------- Table Generation --------------------
function generateTable() {
  parserToTable(jsonObjects);
  addTableSorter();
  shiftView();
}

function parserToTable(jsonObjects) {
  jsonObjects.forEach(function(rawObj, idx) {
    var c = rawObj.Comprobante;
    if (!c) return;

    // Evita duplicados por sello/certificado
    var key = c._certificado || c._Certificado || c._sello || c._Sello;
    if (insertedKeys.indexOf(key) === -1) {
      var row = parserRowAsInvoiceMX(c, fileNames[idx], idx + 1);
      insertRow(row);
      insertedKeys.push(key);
    }
  });
  insertTotals();
}

function insertRow(row) {
  $('#tableData tbody').append(row);
}

function insertTotals() {
  $('#totals').append(
    `<h3>Subtotal: ${granSubTotal.toFixed(2)}</h3>
     <h3>IVA: ${granSubTotalIva.toFixed(2)}</h3>
     <h2>Total: ${granTotal.toFixed(2)}</h2>`
  );
}

// -------------------- View & Sorting --------------------
function addTableSorter() {
  $('table').tablesorter({
    widgets        : ['zebra','columns'],
    usNumberFormat : false,
    sortReset      : true,
    sortRestart    : true,
    sortList       : [[0,0],[1,0]]
  });
  $('table').css("display", "block");
}

function shiftView() {
  $('#fileXML').hide();
  $('#empezar,#bajar').show();
  $('#loading').hide();
}

function showLoading() {
  $('#loading').show();
}

function cleanEverything() {
  $('#totals').empty();
  $('#tableData tbody').empty();
  jsonObjects     = [];
  fileNames       = [];
  insertedKeys    = [];
  granSubTotal    = granSubTotalIva = granTotal = 0;
}

// -------------------- Row Parser (3.2, 3.3, 4.0+) --------------------
function parserRowAsInvoiceMX(comprobante, fileName, i) {
  var version = comprobante._version || comprobante._Version;
  var fecha, rfc, nombre, conceptos, subtotal, iva = 0, total, tipo;

  if (version <= "3.2") {
    // CFDI v3.2
    rfc       = comprobante.Emisor._rfc;
    nombre    = comprobante.Emisor._nombre;
    conceptos = createConceptos(comprobante.Conceptos.Concepto, 3.2);
    subtotal  = setSubtotal(comprobante._subTotal);
    total     = setGranTotal(comprobante._total);
    tipo      = comprobante._TipoDeComprobante;
    fecha     = moment(comprobante._fecha).format('LL');
    iva       = comprobante.Impuestos
                ? setSubtotalIva(comprobante.Impuestos._totalImpuestosTrasladados)
                : 0;
  }
  else if (version === "3.3") {
    // CFDI v3.3
    rfc       = comprobante.Emisor._Rfc;
    nombre    = comprobante.Emisor._Nombre;
    conceptos = createConceptos(comprobante.Conceptos.Concepto, 3.3);
    tipo      = comprobante._TipoDeComprobante;
    subtotal  = setSubtotal(comprobante._SubTotal);
    total     = setGranTotal(comprobante._Total);
    fecha     = moment(comprobante._Fecha).format('LL');
    iva       = comprobante.Impuestos
                ? setSubtotalIva(comprobante.Impuestos._TotalImpuestosTrasladados)
                : 0;
  }
  else {
    // CFDI v4.0+ (igual que 3.3)
    rfc       = comprobante.Emisor._Rfc;
    nombre    = comprobante.Emisor._Nombre;
    conceptos = createConceptos(comprobante.Conceptos.Concepto, 4.0);
    tipo      = comprobante._TipoDeComprobante;
    subtotal  = setSubtotal(comprobante._SubTotal);
    total     = setGranTotal(comprobante._Total);
    fecha     = moment(comprobante._Fecha).format('LL');
    iva       = comprobante.Impuestos
                ? setSubtotalIva(comprobante.Impuestos._TotalImpuestosTrasladados)
                : 0;
  }

  return `<tr>${createTableDivision(
    i, fileName, tipo, fecha,
    rfc, nombre, conceptos,
    subtotal, iva, total
  )}</tr>`;
}

// -------------------- Helpers --------------------
function createTableDivision() {
  return Array.prototype.slice.call(arguments)
    .map(c => `<td>${c||''}</td>`)
    .join('');
}

function setSubtotal(val) {
  granSubTotal += parseFloat(val) || 0;
  return val;
}

function setSubtotalIva(val) {
  granSubTotalIva += parseFloat(val) || 0;
  return val;
}

function setGranTotal(val) {
  granTotal += parseFloat(val) || 0;
  return val;
}

function createConceptos(concepto, version) {
  var key = version <= 3.2 ? '_descripcion' : '_Descripcion';
  if (Array.isArray(concepto)) {
    return concepto.map(c => c[key]).join('<br>');
  }
  return concepto[key];
}

// -------------------- Export a Excel (.xls) --------------------
function exportTableToExcel(tableID){
  var downloadLink;
  var dataType = 'application/vnd.ms-excel';
  var tableSelect = document.getElementById(tableID);
  var tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');
  
  // Nombre con fecha actual
  var name = moment().format("L");
  var filename = name + '.xls';
  
  // Crear enlace de descarga
  downloadLink = document.createElement("a");
  document.body.appendChild(downloadLink);
  
  if (navigator.msSaveOrOpenBlob) {
    var blob = new Blob(['\ufeff', tableHTML], { type: dataType });
    navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    downloadLink.href = 'data:' + dataType + ', ' + tableHTML;
    downloadLink.download = filename;
    downloadLink.click();
  }
}
