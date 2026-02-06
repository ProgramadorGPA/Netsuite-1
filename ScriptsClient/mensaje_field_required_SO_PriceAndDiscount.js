/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog'], function (dialog) {

    function validarLinea(record) {
        var desiredDiscount = record.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_lr_u0197_desired_discount'
        });

        var desiredPrice = record.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_lr_u0197_desired_price'
        });

        // 👉 Si NO hay nada deseado, no valida
        if (!desiredDiscount && !desiredPrice) {
            return true;
        }

        // Campos obligatorios
        var frecuencia = record.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_gpa_frecuencia_descuento'
        });

        var compromiso = record.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_gpa_compromiso_mes'
        });

        if (!frecuencia || !compromiso) {
            dialog.alert({
                title: 'Campos obligatorios',
                message:
                    'Al capturar Precio o Descuento Deseado debes llenar:\n' +
                    '- Frecuencia Descuento\n' +
                    '- Compromiso Compra Mes'
            });
            return false;
        }

        return true;
    }

    function validateLine(context) {
        if (context.sublistId === 'item') {
            return validarLinea(context.currentRecord);
        }
        return true;
    }

    function saveRecord(context) {
        var record = context.currentRecord;
        var lineCount = record.getLineCount({ sublistId: 'item' });

        for (var i = 0; i < lineCount; i++) {
            record.selectLine({
                sublistId: 'item',
                line: i
            });

            if (!validarLinea(record)) {
                return false;
            }
        }

        return true;
    }

    return {
        validateLine: validateLine,
        saveRecord: saveRecord
    };
});