/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

define(['N/record', 'N/ui/dialog', 'N/search'], function (record, dialog, search) {

    var myGlobalVariable = null;

    function validateLine(context) {
        var currentRecord = context.currentRecord;
        var sublistId = context.sublistId;

        var vendorId = currentRecord.getValue({
            fieldId: 'entity'
        });

        //alert(vendorId);

        var lookup = search.lookupFields({
            type: search.Type.VENDOR,
            id: vendorId,
            columns: ['category']
        });

        // Get the ID and Text (Name)
        var categoryId = lookup.category[0].value;
        var categoryName = lookup.category[0].text;

        alert(categoryName);

        if (sublistId === 'item') { // Assuming 'item' is your sublist ID
            var itemValue = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item' // Replace with your item field ID
            });

            // Perform your validation logic here
            if (!itemValue) {
                alert('Seleccione un articulo antes de agregar la linea');
                return false; // Prevent the line from being added
            }

            var itemId = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item' // Replace with your item field ID
            });

            var itemRecord = record.load({
                type: record.Type.INVENTORY_ITEM, // Or other item types
                id: itemId
            });


            //Ini Precios Autorizados por Dirección

            var sublistRecord = itemRecord.getSublistSubrecord({
                sublistId: 'itemvendor',
                fieldId: 'itemvendorprice',
                line: 0
            });

            var vendorprice = sublistRecord.getSublistValue({ sublistId: 'itemvendorpricelines', fieldId: 'vendorprice', line: 0 });
            alert(vendorprice);
            var price = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate' // Replace with your quantity field ID
            });

            currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol4',
                value: vendorprice
            });

            alert(price);    

            if (vendorprice < price) {
                var options = {
                    title: 'Error',
                    message: 'El precio autorizado por dirección es de: ' + vendorprice
                };
                dialog.alert(options);
                return true;
            }

            //Fin Precios Autorizados por Dirección

        }

        return true; // Allow the line to be added if all validations pass
    }

    return {
        validateLine: validateLine
    };
});