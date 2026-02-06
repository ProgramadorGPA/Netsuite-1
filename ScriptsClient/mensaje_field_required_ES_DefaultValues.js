/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search'], function (currentRecord, search) {

    var WAREHOUSE_MAP = {
        '8': 9,
        '1': 20,
        '6': 66,
        '3': 39,
        '4': 48,
        '5': 57,
        '2': 30
    };

    var warehouseWatcher = null;

    /* ===========================
     * PAGE INIT
     * =========================== */

    function pageInit(context) {
        var rec = context.currentRecord;

        setTimeout(function () {
            refreshWarehouse(rec);
            startWarehouseWatcher(rec);
        }, 600);
    }

    /* ===========================
     * FIELD CHANGED
     * =========================== */
    function fieldChanged(context) {

        var rec = context.currentRecord;

        /* ===== CAMBIO CLIENTE ===== */
        if (context.fieldId === 'entity') {

            var customerId = rec.getValue({ fieldId: 'entity' });

            if (!customerId) return;

            try {
                var customerLookup = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: customerId,
                    columns: ['custentitycustentity1']
                });

                if (
                    customerLookup.custentitycustentity1 &&
                    customerLookup.custentitycustentity1.length > 0
                ) {
                    var locationId = customerLookup.custentitycustentity1[0].value;

                    // 🔒 Setear location desde cliente
                    rec.setValue({
                        fieldId: 'location',
                        value: locationId,
                        ignoreFieldChange: true
                    });
                }

            } catch (e) {
                console.error('Error asignando almacén desde cliente', e);
            }

            setTimeout(function () {

                applyCfdiUsagePokaYoke(rec);

                setSelectByText(rec, 'shipcarrier', 'Más');
                disableField(rec, 'shipcarrier');

                setTimeout(function () {
                    setSelectByText(rec, 'shipmethod', 'GPA LOCAL');
                    disableField(rec, 'shipmethod');

                    setSelectByText(
                        rec,
                        'custbody_mx_txn_sat_payment_term',
                        'PPD - Pago en Parcialidades o Diferido'
                    );
                }, 800);

                refreshWarehouse(rec);
                startWarehouseWatcher(rec);

            }, 500);
        }

        /* ===== CAMBIO LOCATION HEADER ===== */
        if (context.fieldId === 'location') {
            refreshWarehouse(rec);
            startWarehouseWatcher(rec);
        }

        /* ===== SELECCIÓN DE ITEM ===== */
        if (context.sublistId === 'item' && context.fieldId === 'item') {
            setTimeout(function () {
                forceCurrentLineWarehouse(rec);
            }, 300);
        }
    }

    /* ===========================
     * LINE INIT
     * =========================== */
    function lineInit(context) {
        if (context.sublistId !== 'item') return;
        if (!window.__defaultWarehouseId) return;

        setTimeout(function () {
            forceCurrentLineWarehouse(context.currentRecord);
        }, 200);
    }

    /* ===========================
     * POST SOURCING
     * =========================== */
    function postSourcing(context) {
        if (context.sublistId !== 'item') return;
        if (context.fieldId !== 'item') return;
        if (!window.__defaultWarehouseId) return;

        setTimeout(function () {
            forceCurrentLineWarehouse(context.currentRecord);
        }, 200);
    }

    /* ===========================
     * VALIDATE LINE
     * =========================== */
    function validateLine(context) {

        if (context.sublistId !== 'item') return true;
        if (!window.__defaultWarehouseId) return true;

        try {
            context.currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'location',
                value: window.__defaultWarehouseId,
                ignoreFieldChange: true
            });
        } catch (e) {}

        return true;
    }

    /* ===========================
     * WATCHER (AGREGAR VARIOS)
     * =========================== */
    function startWarehouseWatcher(rec) {

        if (warehouseWatcher) {
            clearInterval(warehouseWatcher);
        }

        var attempts = 0;
        var lastLineCount = -1;

        warehouseWatcher = setInterval(function () {

            var count = rec.getLineCount({ sublistId: 'item' });

            if (count !== lastLineCount && count > 0) {
                lastLineCount = count;
                applyWarehouseToAllLines(rec);
            }

            attempts++;

            if (attempts >= 12) {
                clearInterval(warehouseWatcher);
                warehouseWatcher = null;
            }

        }, 700);
    }

    /* ===========================
     * APLICAR WAREHOUSE A TODO
     * =========================== */
    function applyWarehouseToAllLines(rec) {

        if (!window.__defaultWarehouseId) return;

        var count = rec.getLineCount({ sublistId: 'item' });

        for (var i = 0; i < count; i++) {
            try {
                rec.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    line: i,
                    value: window.__defaultWarehouseId
                });
            } catch (e) {}
        }
    }

    /* ===========================
     * REFRESH WAREHOUSE HEADER
     * =========================== */
    function refreshWarehouse(rec) {

        var locationId = rec.getValue({ fieldId: 'location' });
        if (!locationId) return;

        var warehouseId = WAREHOUSE_MAP[locationId];

        if (!warehouseId) {
            window.__defaultWarehouseId = null;
            return;
        }

        /*if (!warehouseId) {
            alert('⚠️ NO hay mapeo para esta location');
            return;
        }*/
       

        window.__defaultWarehouseId = warehouseId;
        
        applyWarehouseToAllLines(rec);
    }

    /* ===========================
     * LÍNEA ACTIVA
     * =========================== */
    function forceCurrentLineWarehouse(rec) {

        if (!window.__defaultWarehouseId) return;

        try {
            rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'location',
                value: window.__defaultWarehouseId,
                ignoreFieldChange: true
            });
        } catch (e) {}
    }

    /* ===========================
     * CFDI USAGE – POKA YOKE
     * =========================== */
    function applyCfdiUsagePokaYoke(rec) {

        var entityId = rec.getValue({ fieldId: 'entity' });
        if (!entityId) return;

        var cfdiUsage = rec.getValue({
            fieldId: 'custbody_mx_cfdi_usage'
        });

        if (!cfdiUsage) {
            rec.setValue({
                fieldId: 'custbody_mx_cfdi_usage',
                value: 1, // ✅ ID requerido
                ignoreFieldChange: true
            });
        }
    }

    /* ===========================
     * HELPERS
     * =========================== */
    function setSelectByText(rec, fieldId, text) {
        var field = rec.getField({ fieldId: fieldId });
        if (!field || !field.getSelectOptions) return;

        var options = field.getSelectOptions();
        for (var i = 0; i < options.length; i++) {
            if (options[i].text === text) {
                rec.setValue({
                    fieldId: fieldId,
                    value: options[i].value,
                    ignoreFieldChange: true
                });
                return;
            }
        }
    }

    function disableField(rec, fieldId) {
        try {
            var field = rec.getField({ fieldId: fieldId });
            if (field) field.isDisabled = true;
        } catch (e) {}
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        lineInit: lineInit,
        postSourcing: postSourcing,
        validateLine: validateLine
    };
});