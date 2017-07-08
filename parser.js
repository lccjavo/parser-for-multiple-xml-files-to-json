var jsonObjects=[];
	var granSubTotal = 0;
	var granSubTotalIva = 0;
	var granTotal = 0;
	var insertedKeys = [];

	function generateTable(){
		    //console.log(jsonObjects);
		    cleanEverityng();
		    parserToTable(jsonObjects);	
	}

	function cleanEverityng(){
		$("#totals").html("");
		//$("#tableData tbody").html("");
		granSubTotal = 0;
		granSubTotalIva = 0;
		granTotal = 0;
	}

	function parserToTable(jsonObjects){
		for(var i=0; i<jsonObjects.length; i++){
			if(insertedKeys.indexOf(jsonObjects[i].Comprobante._sello) == -1){
				//console.log("nuevo row", insertedKeys.indexOf(jsonObjects[i].Comprobante._certificado));
				var row = parserRowAsInvoiceMX(jsonObjects[i].Comprobante);
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

	function parserRowAsInvoiceMX(comprobante){
		insertedKeys.push(comprobante._certificado);
		//console.log(insertedKeys, comprobante._certificado);
		var row="<tr>"+
					"<td>"+
					   comprobante._fecha+
					"</td>"+
					"<td>"+
					   comprobante.Emisor._rfc+
					"</td>"+
					"<td>"+
					   comprobante.Emisor._nombre+
					"</td>"+
					"<td>"+
					   createConceptos(comprobante.Conceptos.Concepto)+
					"</td>"+
					"<td>"+
					   setSubtotal(comprobante._subTotal)+
					"</td>"+
					"<td>"+
					   setSubtotalIva(comprobante.Impuestos._totalImpuestosTrasladados)+
					"</td>"+
					"<td>"+
					   setGranTotal(comprobante._total)+
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

	function createConceptos(concepto){
		var conceptosAgrupados = "";
		if(concepto.length>1){
			for(i=0; i<concepto.length; i++){
				if(i==0){
					conceptosAgrupados=concepto[i]._descripcion;
				}
				else{
					conceptosAgrupados=conceptosAgrupados+"<br>"+concepto[i]._descripcion
				}
			}
		}
		else{
			conceptosAgrupados = concepto._descripcion;
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
			var count=fileChooser.files.length;
			for(var i=0; i<count;i++)
			{
			    var file = fileChooser.files[i],
			    reader = new FileReader();
			    waitForTextReadComplete(reader);
			    reader.readAsText(file);
			    if(i == count-1){
			    	generateTable();
			    }
		    }
		}
		fileChooser.addEventListener('change', handleFileSelection, false);
	});
