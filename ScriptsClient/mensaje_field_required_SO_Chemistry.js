/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog'], function (dialog) {

    function saveRecord(context) {
        var record = context.currentRecord;

        // Obtener texto del Delivery Type
        var deliveryTypeText = record.getText({
            fieldId: 'custbody_lr_u0195_delivery_type'
        }) || '';

        // Obtener valor de Fletera
        var fletera = record.getValue({
            fieldId: 'custbody1'
        });

        // Validación: si inicia con "Fletera"
        if (deliveryTypeText.startsWith('Fletera')) {
            if (!fletera) {
                dialog.alert({
                    title: 'Fletera requerida',
                    message: 'Debes seleccionar una fletera cuando el tipo de entrega es Fletera.'
                });
                return false; // Bloquea guardado
            }
        }

        return true;
    }

    return {
        saveRecord: saveRecord
    };
});