/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/record', 'N/ui/dialog', 'N/search'], function (record, dialog, search) {
    //Varibale para validar si algun artículo es de la familia de quimicos
    var itemQuimExist = false;
    //var itemRecubExist = false;
    var recubrimientoArray = [];
    var itemClasificacion = '';
    var itemSinExistArray = [];


    function validateLine(context) {

        var currentRecord = context.currentRecord;
        var sublistId = context.sublistId;

        if (sublistId === 'item') { // Assuming 'item' is your sublist ID

            var itemId = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item' // Replace with your item field ID
            });

            var itemText = currentRecord.getCurrentSublistText({
                sublistId: 'item',
                fieldId: 'item' // Replace with your item field ID
            });
            //alert('itemText: ' + itemText);

            var itemLookup = search.lookupFields({
                type: search.Type.ITEM, // Using the generic 'item' type
                id: itemId,
                columns: ['recordtype'] // Requesting the specific record type
            });
            var itemType = itemLookup.recordtype;
            //alert(itemType);

            if (itemId && itemType != 'noninventoryitem') {
                var itemRecord = record.load({
                    type: record.Type.INVENTORY_ITEM, // Or other item types
                    id: itemId
                });


                //Existencias Stock del Articulo
                var itemFields = search.lookupFields({
                    type: 'inventoryitem',
                    id: itemId,
                    columns: ['quantityonhand', 'quantityavailable']
                });

                if (itemFields.quantityonhand == 0) {
                    itemSinExistArray.push(itemId);
                }
                //alert('Stock: ' + itemFields.quantityonhand);
                //Fin 


                /** OBTENER FAMILIA DE LOS ARTICULOS */
                var numLines = itemRecord.getLineCount({
                    sublistId: 'hierarchyversions'
                });

                //alert('Node: ' + numLines);

                var hierarchyVersionId = itemRecord.getSublistValue({
                    sublistId: 'hierarchyversions',
                    fieldId: 'hierarchynode',
                    line: 0
                });

                //alert('Node: ' + hierarchyVersionId);
                // Ini Familia del Arículo

                if (itemRecord) {
                    var hierarchyNodeId = hierarchyVersionId;

                    var hierarchyNodeName = search.lookupFields({
                        type: 'merchandisehierarchynode',
                        id: hierarchyNodeId,
                        columns: ['name']
                    }).name;

                    //alert('Familia: ' + hierarchyNodeName);

                    if (hierarchyNodeName === 'Productos Quimicos' || hierarchyNodeName === 'Cuñetes de Cloro') {
                        itemQuimExist = true;
                    }
                    if (hierarchyNodeName.indexOf('Recubrimiento') !== -1 && itemText.substring(0, 2) != 'MU') {
                        recubrimientoArray.push(itemId);
                        //alert('Familia: ' + hierarchyNodeName);
                        var unitsType = itemRecord.getValue({ fieldId: 'unitstype' });
                        //alert(unitsType);
                        var unitsTypeRecord = record.load({
                            type: 'unitstype',
                            id: unitsType
                        });
                        var saleUnit = itemRecord.getValue({ fieldId: 'stockunit' });   // ID de la unidad de venta
                        //alert(saleUnit);

                        // El sublist 'uom' contiene todas las unidades de ese tipo
                        var lineCount = unitsTypeRecord.getLineCount({ sublistId: 'uom' });
                        //alert(lineCount);
                        for (var i = 0; i < lineCount; i++) {
                            var unitId = unitsTypeRecord.getSublistValue({ sublistId: 'uom', fieldId: 'internalid', line: i });
                            if (unitId == saleUnit) {
                                var unitName = unitsTypeRecord.getSublistValue({
                                    sublistId: 'uom',
                                    fieldId: 'unitname',
                                    line: i
                                });
                                var rate = unitsTypeRecord.getSublistValue({
                                    sublistId: 'uom',
                                    fieldId: 'conversionrate',
                                    line: i
                                });

                                var quantity = currentRecord.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity' // Replace with your quantity field ID
                                });
                                //alert(getDecimalPart((quantity / rate).toFixed(2)));
                                if (getDecimalPart((quantity / rate).toFixed(2)) > 0.00) {
                                    //alert(quantity);
                                    //alert(rate);
                                    var options = {
                                        title: 'Información',
                                        message: 'El Cantidad en el Artículo debe estar en multiplos de: ' + rate,
                                        buttons: [{
                                            label: 'Entendio',
                                            value: false
                                        }]
                                    };

                                    var userResponse = dialog.create(options).then(function (result) {
                                        return result; // Returns true if Yes, false if No
                                    });

                                    if (!userResponse.value) { // If user clicked No
                                        return false; // Prevent record submission
                                    }

                                }
                                continue;
                            }
                        }

                        //Lotes de Recubrimientos
                        var inventoryNumberSearch = search.create({
                            type: 'inventorynumber',
                            filters: [
                                ['item', 'anyof', itemId]
                            ],
                            columns: [
                                'inventorynumber', // El número de lote/serie
                                'expirationdate',  // Fecha de caducidad
                                'quantityonhand'   // Cantidad disponible
                            ]
                        });

                        var batch = true;
                        //alert(itemId);
                        inventoryNumberSearch.run().each(function (result) {
                            var batchName = result.getValue('inventorynumber');
                            var qty = result.getValue('quantityonhand');
                            //alert('Lote: ' + batchName + ' | Cantidad: ' + qty);
                            if (quantity < qty) {
                                batch = false;
                                return false;
                            }
                            else {
                                return true;
                            }
                        });

                        if (batch == true) {
                            var options = {
                                title: 'Información',
                                message: 'No hay existencia de un solo Lote para surtir la cantidad requerida del Artículo',
                                buttons: [{
                                    label: 'Entendio',
                                    value: false
                                }]
                            };

                            var userResponse = dialog.create(options).then(function (result) {
                                return result; // Returns true if Yes, false if No
                            });

                            if (!userResponse.value) { // If user clicked No
                                return false; // Prevent record submission
                            }
                        }



                    }

                }
                // Fin Familia del Artículo

                //Articulos Descontinuados Moneda MXP
                var itemDescontinuado = itemRecord.getText({
                    fieldId: 'custitem_gpa_clasificacion' // Use lowercase field ID for body fields
                });

                //Articulos Clasificacion: Sobre Pedido
                itemClasificacion = itemRecord.getText({
                    fieldId: 'custitem_gpa_clasificacion' // Use lowercase field ID for body fields
                });

                //alert(itemClasificacion);

                var basePrice = itemRecord.getMatrixSublistValue({
                    sublistId: 'price5',
                    fieldId: 'price',
                    column: 0,
                    line: 0
                });

                if ((basePrice === '' || basePrice === 0) && itemDescontinuado === 'Descontinuado') {
                    var options = {
                        title: 'Información',
                        message: 'El Artículo es Descontinuado y el precio base no esta en MXP',
                        buttons: [{
                            label: 'Entendio',
                            value: false
                        }]
                    };

                    var userResponse = dialog.create(options).then(function (result) {
                        return result; // Returns true if Yes, false if No
                    });

                    if (!userResponse.value) { // If user clicked No
                        return false; // Prevent record submission
                    }
                }



            }
            // Fin Set Datos NO_INVENTORY ITEMS    

        }

        return true; // Allow the line to be added if all validations pass
    }

    function removeItemAll(arr, value) {
        return arr.filter(function (element) {
            return element !== value;
        });
    }

    function getDecimalPart(num) {
        return Math.abs(num % 1);
    }

    function validateDelete(context) {
        var currentRecord = context.currentRecord;
        var sublistId = context.sublistId;

        if (sublistId === 'item') {
            // Get the value of the 'item' field (which holds the internal ID of the item)
            // You are accessing the value of the line *before* it is deleted.
            var itemId = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item'
            });

            // Perform your validation logic
            if (recubrimientoArray.includes(itemId)) {
                // Prevent deletion
                //alert(recubrimientoArray.length);
                var newArray = removeItemAll(recubrimientoArray, itemId);
                recubrimientoArray = newArray;
                //alert(recubrimientoArray.length);
                // dialog.alert({
                //     title: 'Cannot Delete',
                //     message: 'Deletion of this specific item is not allowed.'
                // });

            }

            if (itemSinExistArray.includes(itemId)) {
                var newArray = removeItemAll(itemSinExistArray, itemId);
                itemSinExistArray = newArray;
            }

        }

        // For all other sublists or if the condition is met, allow the deletion
        return true;
    }

    


    function saveRecord(context) {

        var currentRecord = context.currentRecord;

        var startDate = currentRecord.getValue('trandate');
        var endDate   = currentRecord.getValue('shipdate');

        var d1 = null;
        var d2 = null;

        if (startDate && endDate) {
            d1 = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            d2 = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        }

        //Tipo de Entrega Cliente Presente
        var fieldValue = currentRecord.getValue('shipdate');

        if (fieldValue) {
            try {


                var tipoEntrega = currentRecord.getText('custbody_lr_u0195_delivery_type');

                if (d1.getTime() != d2.getTime() && tipoEntrega == 'F.O.B. Entrega en almacén GPA CON Cliente Presente') {

                    var options = {
                        title: 'Información!',
                        message: 'El Tipo de Entrega no corresponde con la Fecha de Entrega',
                        buttons: [{
                            label: 'Entendio',
                            value: false
                        }]
                    };
                    var userResponse = dialog.create(options).then(function (result) {
                        return result; // Returns true if Yes, false if No
                    });

                    if (!userResponse.value) { // If user clicked No
                        return false; // Prevent record submission
                    }

                }

            } catch (e) {

                log.error({
                    title: e.name,
                    details: e.message
                });
            }


        }


        //Fletera no maneja Quimicos            
        var fieldTextLoc = currentRecord.getValue('location');
        //alert(fieldTextLoc);
        var fieldTextCarr = currentRecord.getText('custbody1');
        //alert(fieldTextCarr);

        if (fieldTextCarr != '') {
            var mySearch = search.create({
                type: 'customrecord1500', // El ID de cadena de tu registro
                filters: [
                    ['custrecord3', 'is', fieldTextLoc],
                    'AND',
                    ['name', 'is', fieldTextCarr]
                ],
                columns: ['custrecord5', 'name']
            });

            //alert(fieldTextLoc);
            var manejaQuim = false;

            mySearch.run().each(function (result) {
                var value1 = result.getValue({ name: 'custrecord5' });
                var name = result.getValue({ name: 'name' });
                //alert('Valor encontrado: '+name+ ' maneja quimico: '+value1);
                manejaQuim = result.getValue({ name: 'custrecord5' });
                return false; // Continuar iterando
            });

            //alert(manejaQuim);
            if (itemQuimExist == true && manejaQuim == false) {
                var options = {
                    title: 'Información!',
                    message: 'La Fletera Seleccionada no maneja Quimicos',
                    buttons: [{
                        label: 'Entendio',
                        value: false
                    }]
                };

                var userResponse = dialog.create(options).then(function (result) {
                    return result; // Returns true if Yes, false if No
                });

                if (!userResponse.value) { // If user clicked No
                    return false; // Prevent record submission
                }

            }
        }

        //Fletera no maneja Recubrimiento            
        fieldTextLoc = currentRecord.getValue('location');
        //alert(fieldTextLoc);
        fieldTextCarr = currentRecord.getText('custbody1');
        //alert(fieldTextCarr);

        if (fieldTextCarr != '') {
            var mySearch = search.create({
                type: 'customrecord1500', // El ID de cadena de tu registro
                filters: [
                    ['custrecord3', 'is', fieldTextLoc],
                    'AND',
                    ['name', 'is', fieldTextCarr]
                ],
                columns: ['custrecord6', 'name']
            });

            //alert(fieldTextLoc);
            var manejaRecub = false;

            mySearch.run().each(function (result) {
                var value1 = result.getValue({ name: 'custrecord6' });
                var name = result.getValue({ name: 'name' });
                //alert('Valor encontrado: '+name+ ' maneja quimico: '+value1);
                manejaRecub = result.getValue({ name: 'custrecord6' });
                return false; // Continuar iterando
            });

            //alert(manejaQuim);
            if (recubrimientoArray.length > 0 && manejaRecub == false) {
                var options = {
                    title: 'Información!',
                    message: 'La Fletera Seleccionada no maneja Recubrimientos',
                    buttons: [{
                        label: 'Entendio',
                        value: false
                    }]
                };

                var userResponse = dialog.create(options).then(function (result) {
                    return result; // Returns true if Yes, false if No
                });

                if (!userResponse.value) { // If user clicked No
                    return false; // Prevent record submission
                }

            }
        }


        // SO CON GUIA PREPAGADA
        fieldValue = currentRecord.getValue('custbody_lr_u0195_delivery_type');
        if (fieldValue === '21') {

            fieldValue = currentRecord.getValue('custbody_gpa_guia_prepagada');
            if (fieldValue === '') {
                var options = {
                    title: 'Información!',
                    message: 'Se requiere agregar el Archivo de Guía Prepagada',
                    buttons: [{
                        label: 'Entendio',
                        value: false
                    }]
                };

                var userResponse = dialog.create(options).then(function (result) {
                    return result; // Returns true if Yes, false if No
                });

                if (!userResponse.value) { // If user clicked No
                    return false; // Prevent record submission
                }
            }
        }
        //FIN SO CON GUIA PREPAGADA

        // SO CON ENTREGA FOB Y MAS DE 5 ARTICULOS
        fieldValue = currentRecord.getText('custbody_lr_u0195_delivery_type');
        var lineCount = currentRecord.getLineCount({
            sublistId: 'item'
        });
        //alert('Entrega ' + fieldValue);
        if (lineCount > 5 && fieldValue.indexOf("F.O.B. Entrega en almacén GPA CON Cliente Presente") !== -1) {
            var options = {
                title: 'Información!',
                message: 'El Número de lineas de articulos para FOB no puede ser mayor a ' + 5,
                buttons: [{
                    label: 'Entendio',
                    value: false
                }]
            };

            var userResponse = dialog.create(options).then(function (result) {
                return result; // Returns true if Yes, false if No
            });

            if (!userResponse.value) { // If user clicked No
                return false; // Prevent record submission
            }

        }
        //FIN SO CON ENTREGA FOB Y MAS DE 5 ARTICULOS

        // SO FECHA DE ENVIO
        fieldValue = currentRecord.getValue('shipdate');

        if (fieldValue) {
            try {

                var startDate = currentRecord.getValue('trandate');
                var endDate = currentRecord.getValue('shipdate');

                var d1 = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                var d2 = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

                var tipoEntregaText = currentRecord.getText({
                    fieldId: 'custbody_lr_u0195_delivery_type'
                }) || '';

                // ======================================
                // VALIDACIÓN POR TIPO DE ENTREGA (GPA)
                // ======================================
                // 🚪 Escape para GPA Logística en Domicilio del Cliente
                if (tipoEntregaText !== 'GPA Logistica en Domicilio del Cliente') {

                    if (d1.getTime() !== d2.getTime()) {

                        dialog.alert({
                            title: 'Error',
                            message: 'La fecha de entrega debe ser igual a la fecha del documento.'
                        });

                        return false;
                    }
                }

            } catch (e) {

                log.error({
                    title: e.name,
                    details: e.message
                });
            }
        }
        //FIN SO FECHA DE ENVIO

        //Require Anticipo
        fieldValue = currentRecord.getValue('custbody_lr_u0197_anticipio_required');
        //alert(fieldValue);
        if (fieldValue == true) {

            fieldValue = currentRecord.getValue('custbody_lr_u0197_invoice_anticipio');
            alert(fieldValue + ' Vacio');
            if (fieldValue == '') {
                var options = {
                    title: 'Información!',
                    message: 'Se requiere agregar la Factura de Anticipo',
                    buttons: [{
                        label: 'Entendio',
                        value: false
                    }]
                };

                var userResponse = dialog.create(options).then(function (result) {
                    return result; // Returns true if Yes, false if No
                });

                if (!userResponse.value) { // If user clicked No
                    return false; // Prevent record submission
                }
            }
        }

        //Pedido - Sobre Pedido
        if (itemClasificacion == 'Sobre Pedido') {

            fieldValue = currentRecord.getValue('custbody_gpa_orden_compra_aplicada');
            //alert(fieldValue);
            if (fieldValue === '') {
                var options = {
                    title: 'Información!',
                    message: 'Uno de los Articulos tiene la clasificación Sobre Pedido se requiere la Orden de Compra',
                    buttons: [{
                        label: 'Entendio',
                        value: false
                    }]
                };

                var userResponse = dialog.create(options).then(function (result) {
                    return result; // Returns true if Yes, false if No
                });

                if (!userResponse.value) { // If user clicked No
                    return false; // Prevent record submission
                }
            }
        }

        //Pedido - Desarmado
        fieldValue = currentRecord.getValue('custbody_lr_u0197_desarmado');
        if (fieldValue == true) {
            var documentFieldId = 'custbody_gpa_orden_compra_aplicada';
            var fileId = currentRecord.getValue({
                fieldId: documentFieldId
            });

            if (!fileId && itemSinExistArray.length > 0) {
                var options = {
                    title: 'Información!',
                    message: 'Debe de agregar la orden de compra para el pedido de desarmado',
                    buttons: [{
                        label: 'Entendio',
                        value: false
                    }]
                };

                var userResponse = dialog.create(options).then(function (result) {
                    return result; // Returns true if Yes, false if No
                });

                if (!userResponse.value) { // If user clicked No
                    return false; // Prevent record submission
                }
            }
        }


        return true; // Allow record submission
    }
    return {
        saveRecord: saveRecord,
        validateLine: validateLine,
        validateDelete: validateDelete
    };
})