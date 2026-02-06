/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog'], function (dialog) {

    function saveRecord(context) {

        var currentRecord = context.currentRecord;

        var tipoEntregaText = currentRecord.getText({
            fieldId: 'custbody_lr_u0195_delivery_type'
        }) || '';

        // ======================================
        // VALIDACIÓN +30 DÍAS
        // SOLO GPA Logística Domicilio
        // ======================================
        if (tipoEntregaText === 'GPA Logistica en Domicilio del Cliente') {

            var startDate = currentRecord.getValue('trandate');
            var endDate   = currentRecord.getValue('shipdate');

            if (startDate && endDate) {

                var d1 = new Date(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate()
                );

                var d2 = new Date(
                    endDate.getFullYear(),
                    endDate.getMonth(),
                    endDate.getDate()
                );

                // Fecha máxima permitida (+30 días)
                var maxDate = new Date(d1);
                maxDate.setDate(maxDate.getDate() + 30);

                // ❌ Fecha anterior al documento
                if (d2 < d1) {
                    dialog.alert({
                        title: 'Error',
                        message: 'La fecha de entrega no puede ser anterior a la fecha del documento.'
                    });
                    return false;
                }

                // ❌ Excede +30 días
                if (d2 > maxDate) {
                    dialog.alert({
                        title: 'Error',
                        message: 'La fecha de entrega no puede exceder 30 días a partir de la fecha del documento.'
                    });
                    return false;
                }
            }
        }

        return true;
    }

    return {
        saveRecord: saveRecord
    };
});