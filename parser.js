	var jsonObjects=[];
	var granSubTotal = 0;
	var granSubTotalIva = 0;
	var granTotal = 0;
	var insertedKeys = [];
	var fileNames=[];

	function generateTable(){
		    parserToTable(jsonObjects);  
		    addTableSorter();
		    shiftView(); 
	}

	function generateTableBtn(){
		    parserToTable(jsonObjects);  
		    setTimeout(function(){ addTableSorter(); }, 1000);
	}

	function shiftView(){
		$("#fileXML").css("display", "none");
		$("#empezar").css("display", "block");
		$("#bajar").css("display", "block");
		$("#loading").css("display", "none");
	}

	function showLoading(){
		$("#loading").css("display", "block");
	}

	function exportTableToExcel(tableID){
	    var downloadLink;
	    var dataType = 'application/vnd.ms-excel';
	    var tableSelect = document.getElementById(tableID);
	    var tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');
	    
	    // Specify file name
	    var name = moment().format("L");
	    filename = name+'.xls';
	    
	    // Create download link element
	    downloadLink = document.createElement("a");
	    
	    document.body.appendChild(downloadLink);
	    
	    if(navigator.msSaveOrOpenBlob){
	        var blob = new Blob(['\ufeff', tableHTML], {
	            type: dataType
	        });
	        navigator.msSaveOrOpenBlob( blob, filename);
	    }else{
	        // Create a link to the file
	        downloadLink.href = 'data:' + dataType + ', ' + tableHTML;
	    
	        // Setting the file name
	        downloadLink.download = filename;
	        
	        //triggering the function
	        downloadLink.click();
	    }
	}

	function addTableSorter(){
		$(function(){
			$('table').tablesorter({
				widgets        : ['zebra', 'columns'],
				usNumberFormat : false,
				sortReset      : true,
				sortRestart    : true,
				sortList: [[0,0],[1,0]]
			});
			$('table').css("display", "block");
		});
	}

	function cleanEverityng(){
		$("#totals").html("");
		$("#tableData tbody").html("");
		jsonObjects=[];
		fileNames=[];
		insertedKeys = [];
		granSubTotal = 0;
		granSubTotalIva = 0;
		granTotal = 0;
	}

	function parserToTable(jsonObjects){
		for(var i=0; i<jsonObjects.length; i++){
			if((insertedKeys.indexOf(jsonObjects[i].Comprobante._sello) == -1) || (insertedKeys.indexOf(jsonObjects[i].Comprobante._Sello) == -1)){
				//console.log("nuevo row", insertedKeys.indexOf(jsonObjects[i].Comprobante));
				
				var row = parserRowAsInvoiceMX(jsonObjects[i].Comprobante, fileNames[i], i+1);
				insertRow(row);
				if(i == jsonObjects.length-1){
					insertTotals();
				}
			}
			else{
				//console.log("existente row", jsonObjects[i].Comprobante._certificado);
			}
			
		}
	}

	function insertTotals(){
		var totals="<h3>subtotal: "+granSubTotal+"</h3>"+
		           "<h3>iva: "+granSubTotalIva+"</h3>"+
		           "<h2>total: "+granTotal+"</h3>";
		$("#totals").append(totals)
	}

	function insertRow(row){
		$("#tableData tbody").append(row);
	}

	function parserRowAsInvoiceMX(comprobante, fileName, i){
		insertedKeys.push(comprobante._certificado);
		
		if(comprobante._version){ var version = comprobante._version; };
		if(comprobante._Version){ var version = comprobante._Version; };

		//console.log(version, comprobante);		

	   if(comprobante._version <= "3.2"){
	   		var fecha = comprobante._fecha;
	   }
	   if(comprobante._Version == "3.3"){
	   		var fecha = comprobante._Fecha;
	   }

	   if(comprobante._version <= "3.2"){
	   		var rfc = comprobante.Emisor._rfc;
	   }
	   if(comprobante._Version == "3.3"){
	   		var rfc = comprobante.Emisor._Rfc;
	   }

	   if(comprobante._version <= "3.2"){
	   		var nombre = comprobante.Emisor._nombre;
	   }
	   if(comprobante._Version == "3.3"){
	   		var nombre = comprobante.Emisor._Nombre;
	   }


	   if(comprobante._version <= "3.2"){
	   		var conceptos = createConceptos(comprobante.Conceptos.Concepto, 3.2);
	   }
	   if(comprobante._Version == "3.3"){
	   		var conceptos = createConceptos(comprobante.Conceptos.Concepto, 3.3);
	   }


	   if(comprobante._version <= "3.2"){
	   		var subtotal = setSubtotal(comprobante._subTotal);
	   	}
	   	if(comprobante._Version == "3.3"){
	   		var subtotal = setSubtotal(comprobante._SubTotal);
	   	}

	   if(comprobante._version <= "3.2"){
	   		if(comprobante.Impuestos){
	   			var iva = setSubtotalIva(comprobante.Impuestos._totalImpuestosTrasladados);
	   		}
	   		else{
	   			var iva = 0;
	   		}
	   	}
	   	if(comprobante._Version == "3.3"){
	   		if(comprobante.Impuestos){
	   			var iva = setSubtotalIva(comprobante.Impuestos._TotalImpuestosTrasladados);
	   		}
	   		else{
	   			var iva = 0;
	   		}
	   	}


		if(comprobante._version <= "3.2"){
	   		var total = setGranTotal(comprobante._total);
	   	}
	   	if(comprobante._Version == "3.3"){
	   		var total = setGranTotal(comprobante._Total);
	   	}

	   	var tipo = comprobante._TipoDeComprobante;

	   	var row="<tr>"+
	   				"<td>"+
					   i+
					"</td>"+
	   				"<td>"+
					   fileName+
					"</td>"+
	   				"<td>"+
					   tipo+
					"</td>"+
					"<td>"+
					   moment(fecha).format('LL')+
					"</td>"+
					"<td>"+
					   rfc+
					"</td>"+
					"<td>"+
					   nombre+
					"</td>"+
					"<td>"+
					   conceptos+
					"</td>"+
					"<td>"+
						subtotal+
					"</td>"+
					"<td>"+
						iva+					   
					"</td>"+
					"<td>"+
						total+					   
					"</td>"+
				"</tr>";
		return row;
	}

	function setSubtotal(subtotal){
		//console.log("subtotal", subtotal, granSubTotal);
		granSubTotal = granSubTotal + parseInt(subtotal);
		return subtotal;
	}

	function setSubtotalIva(iva){
		//console.log("IVA",iva, granSubTotalIva);
		granSubTotalIva = granSubTotalIva + parseInt(iva);
		return iva;
	}

	function setGranTotal(total){
		granTotal = granTotal + parseInt(total);
		return total;
	}

	function createConceptos(concepto, version){
		var conceptosAgrupados = "";
		if(concepto.length>1){
			for(i=0; i<concepto.length; i++){
				if(i==0){
					if(version <=3.2){
						conceptosAgrupados=concepto[i]._descripcion;
					}
					if(version == 3.3){
						conceptosAgrupados=concepto[i]._Descripcion;
					}
				}
				else{
					if(version <=3.2){
						conceptosAgrupados=conceptosAgrupados+"<br>"+concepto[i]._descripcion
					}
					if(version == 3.3){
					    conceptosAgrupados=conceptosAgrupados+"<br>"+concepto[i]._Descripcion
					}
					
				}
			}
		}
		else{
			if(version <=3.2){
				conceptosAgrupados = concepto._descripcion;
			}
			if(version == 3.3){
			    conceptosAgrupados = concepto._Descripcion;
			}
			
			
		}

		return conceptosAgrupados;			
	}

	$(document).ready(function() {
		var fileChooser = document.getElementById('fileXML');

		function parseTextAsXml(text) {	    	   
		    var x2js = new X2JS();
		    var json=x2js.xml_str2json(text);	    
		    jsonObjects.push(json);	
		}
		

		function waitForTextReadComplete(reader) {
		    reader.onloadend = function(event) {
		        var text = event.target.result;
		        parseTextAsXml(text);
		    }
		}

		function handleFileSelection() {
			cleanEverityng();
			showLoading();
			var count=fileChooser.files.length;
			for(var i=0; i<count;i++)
			{
			    var file = fileChooser.files[i],
			    reader = new FileReader();
			    waitForTextReadComplete(reader);
			    reader.readAsText(file);
			    fileNames.push(file.name);
		    }
			setTimeout(function(){ generateTable(); }, 1000);

		}
		fileChooser.addEventListener('change', handleFileSelection, false);
	});
