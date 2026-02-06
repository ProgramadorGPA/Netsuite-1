/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog'], function (currentRecord, dialog) {

    // Tipos que REQUIEREN fletera (IDs reales)
    var DELIVERY_REQUIERE_FLETERA = ['23','24','25','26', '18', '13'];

    // Tipos permitidos por escenario (IDs)
    var TIPOS_SIEMPRE = ['33','30']; // Re-facturación / Otros cargos
    var TIPOS_FOB     = ['2','5'];
    var TIPOS_GPA_BCS = ['18','13']; // GPA logística
    var TIPOS_FLETERA = ['23','24','25','26'];


    function fieldChanged(context) {
        if (context.fieldId !== 'custbody_lr_u0195_delivery_type') return;

        var rec = currentRecord.get();

        var tipoId       = String(rec.getValue({ fieldId: 'custbody_lr_u0195_delivery_type' }) || '');
        var locationText = (rec.getText({ fieldId: 'location' }) || '').toUpperCase();
        var shipAddress  = (rec.getValue({ fieldId: 'shipaddress' }) || '').toUpperCase();

        var esSucursalLC =
            locationText === 'SUC. LC' ||
            locationText === 'SUC. LC : PRODUCTIVO';

        if (!esSucursalLC) return;

        var esBCS =
            shipAddress.indexOf('BCS') !== -1 ||
            shipAddress.indexOf('BAJA CALIFORNIA SUR') !== -1;

        // 🔐 Construir permitidos por ID
        var tiposPermitidos = [].concat(TIPOS_SIEMPRE, TIPOS_FOB);
            tiposPermitidos = esBCS
            ? tiposPermitidos.concat(TIPOS_GPA_BCS)
            : tiposPermitidos.concat(TIPOS_FLETERA);

        // 🚫 Tipo NO permitido
        if (tiposPermitidos.indexOf(tipoId) === -1) {
            dialog.alert({
                title: 'Tipo de Entrega no permitido',
                message:
                    'Este tipo de entrega no es válido para Sucursal Cabos ' +
                    (esBCS ? 'con destino BCS.' : 'fuera de BCS.')
            });

            rec.setValue({
                fieldId: 'custbody_lr_u0195_delivery_type',
                value: '',
                ignoreFieldChange: true
            });
            return;
        }

        // ⚠️ Requiere fletera → SOLO ALERTA (NO BORRA)
        if (DELIVERY_REQUIERE_FLETERA.indexOf(tipoId) !== -1) {
            var fletera = rec.getValue({ fieldId: 'custbody1' });
            if (!fletera) {
                dialog.alert({
                    title: 'Fletera requerida',
                    message: 'Este tipo de entrega requiere seleccionar fletera.'
                });
            }
        }
    }

    function saveRecord(context) {
        var rec = currentRecord.get();
        var tipoId = String(rec.getValue({ fieldId: 'custbody_lr_u0195_delivery_type' }) || '');

        if (DELIVERY_REQUIERE_FLETERA.indexOf(tipoId) !== -1) {
            var fletera = rec.getValue({ fieldId: 'custbody1' });
            if (!fletera) {
                dialog.alert({
                    title: 'Fletera requerida',
                    message: 'Debes seleccionar fletera antes de guardar.'
                });
                return false;
            }
        }
        return true;
    }

    return {
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
});