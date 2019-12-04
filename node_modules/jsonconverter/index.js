

var $=require('jquery');
var X2JS=require('./xml2json');
require('./vkbeautify.0.99.00.beta.js');

$(document).ready(function () {
            function tryParseJSON (jsonString){
                try {
                    var o = JSON.parse(jsonString);

                    // Handle non-exception-throwing cases:
                    // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
                    // but... JSON.parse(null) returns null, and typeof null === "object", 
                    // so we must check for that, too. Thankfully, null is falsey, so this suffices:
                    if (o && typeof o === "object") {
                        return o;
                    }
                }
                catch (e) { }

                return false;
            };

            $("#btnConvert").click(function(){
                var x2js = new X2JS(
                    {
                        attributePrefix : "@"
                    }
                );
                if(tryParseJSON($("#ContentArea").val()))
                    convertJSon2XML();
                    else
                    convertXml2JSon();
                function convertXml2JSon() {
                    $("#ConvertedArea").val(vkbeautify.json(JSON.stringify(x2js.xml_str2json($("#ContentArea").val()))));
                }   

                function convertJSon2XML() {
                    $("#ConvertedArea").val(vkbeautify.xml(x2js.json2xml_str($.parseJSON($("#ContentArea").val()))));
                }                
        });
        
 });