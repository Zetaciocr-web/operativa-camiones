// Importar funciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDZQ7AK_a4__wJEbD-Eay2AQ6uT4dI21LA",
  authDomain: "operativa-camiones.firebaseapp.com",
  projectId: "operativa-camiones",
  storageBucket: "operativa-camiones.firebasestorage.app",
  messagingSenderId: "401625540838",
  appId: "1:401625540838:web:9c1db7a1adabea1697327"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Variables de estado
let datosCamiones = JSON.parse(localStorage.getItem("datosCamiones")) || [];
let registroSeleccionadoId = null;

// Funciones de la aplicación
function calcularPesoNeto() {
  const tara = parseFloat(document.getElementById("tara").value) || 0;
  const bruto = parseFloat(document.getElementById("bruto").value) || 0;
  
  if (document.getElementById("bruto").value !== "" || document.getElementById("tara").value !== "") {
    const neto = bruto - tara;
    document.getElementById("neto").value = neto >= 0 ? neto.toFixed(2) : "0.00";
  } else {
    document.getElementById("neto").value = "";
  }
}

function poblarSelect(lista) {
  const select = document.getElementById("selectConductor");
  if (lista.length === 0) {
    select.innerHTML = '<option value="">-- Sin registros guardados --</option>';
    return;
  }
  select.innerHTML = '<option value="">-- Seleccionar de los registros --</option>';
  lista.forEach(item => {
    select.innerHTML += `<option value="${item.id}">${item.conductor} (${item.placa || 'Sin placa'})</option>`;
  });
}

function buscarEnTiempoReal() {
  const texto = document.getElementById("buscador").value.toLowerCase().trim();
  if (!texto) {
    poblarSelect(datosCamiones);
    return;
  }

  const filtrados = datosCamiones.filter(c => 
    (c.conductor && c.conductor.toLowerCase().includes(texto)) ||
    (c.placa && c.placa.toLowerCase().includes(texto)) ||
    (c.licencia && c.licencia.toLowerCase().includes(texto)) ||
    (c.tel && c.tel.toLowerCase().includes(texto)) ||
    (c.contenedor && c.contenedor.toLowerCase().includes(texto)) ||
    (c.observaciones && c.observaciones.toLowerCase().includes(texto))
  );

  poblarSelect(filtrados);

  if (filtrados.length > 0) {
    document.getElementById("selectConductor").value = filtrados[0].id;
    cargarCamionEnFormulario(filtrados[0]);
  } else {
    limpiarFormularioSinBuscador();
  }
}

function cargarDatosDesdeSelect() {
  const id = document.getElementById("selectConductor").value;
  if (id === "") {
    limpiarFormularioSinBuscador();
    return;
  }
  const c = datosCamiones.find(item => item.id === parseInt(id));
  if (c) cargarCamionEnFormulario(c);
}

function cargarCamionEnFormulario(c) {
  registroSeleccionadoId = c.id;
  document.getElementById("conductor").value = c.conductor || "";
  document.getElementById("placa").value = c.placa || "";
  document.getElementById("licencia").value = c.licencia || "";
  document.getElementById("exp").value = c.exp || "";
  document.getElementById("tel").value = c.tel || "";
  document.getElementById("empresa").value = c.empresa || "";
  document.getElementById("precinto").value = c.precinto || "";
  document.getElementById("contenedor").value = c.contenedor || "";
  document.getElementById("tara").value = c.tara || "";
  document.getElementById("bruto").value = c.bruto || "";
  document.getElementById("neto").value = c.neto || "";
  document.getElementById("observaciones").value = c.observaciones || "";
  
  document.getElementById("llego").checked = (c.estado === "LLEGO");
  document.getElementById("noLlego").checked = (c.estado === "NO LLEGO");
  document.getElementById("ninguno").checked = (!c.estado || c.estado === "");

  calcularPesoNeto();
}

function guardarRegistro() {
  const conductor = document.getElementById("conductor").value.trim();
  if (!conductor) {
    alert("Por favor ingresa al menos el nombre del CONDUCTOR.");
    return;
  }

  let idActual;
  if (registroSeleccionadoId !== null) {
    idActual = registroSeleccionadoId;
  } else {
    idActual = datosCamiones.length > 0 ? Math.max(...datosCamiones.map(d => d.id)) + 1 : 1;
  }

  let estadoSeleccionado = "";
  if (document.getElementById("llego").checked) estadoSeleccionado = "LLEGO";
  else if (document.getElementById("noLlego").checked) estadoSeleccionado = "NO LLEGO";

  calcularPesoNeto();

  const nuevoRegistro = {
    id: idActual,
    conductor: conductor,
    placa: document.getElementById("placa").value,
    licencia: document.getElementById("licencia").value,
    exp: document.getElementById("exp").value,
    tel: document.getElementById("tel").value,
    empresa: document.getElementById("empresa").value,
    precinto: document.getElementById("precinto").value,
    contenedor: document.getElementById("contenedor").value,
    tara: document.getElementById("tara").value,
    neto: document.getElementById("neto").value,
    bruto: document.getElementById("bruto").value,
    estado: estadoSeleccionado,
    observaciones: document.getElementById("observaciones").value
  };

  if (registroSeleccionadoId !== null) {
    const index = datosCamiones.findIndex(item => item.id === registroSeleccionadoId);
    datosCamiones[index] = nuevoRegistro;
  } else {
    datosCamiones.push(nuevoRegistro);
  }

  localStorage.setItem("datosCamiones", JSON.stringify(datosCamiones));
  alert("¡Guardado correctamente!");
  poblarSelect(datosCamiones);
  limpiarFormulario();
}

function borrarRegistro() {
  if (registroSeleccionadoId === null) {
    alert("Primero busca y selecciona un conductor para poder borrarlo.");
    return;
  }

  const conductorNombre = document.getElementById("conductor").value;
  if (confirm(`¿Estás seguro de eliminar a: ${conductorNombre}?`)) {
    datosCamiones = datosCamiones.filter(item => item.id !== registroSeleccionadoId);
    datosCamiones = datosCamiones.map((item, index) => ({ ...item, id: index + 1 }));

    localStorage.setItem("datosCamiones", JSON.stringify(datosCamiones));
    alert("Registro eliminado.");
    poblarSelect(datosCamiones);
    limpiarFormulario();
  }
}

function limpiarFormulario() {
  document.getElementById("buscador").value = "";
  limpiarFormularioSinBuscador();
  poblarSelect(datosCamiones);
}

function limpiarFormularioSinBuscador() {
  registroSeleccionadoId = null;
  document.getElementById("formCamion").reset();
  document.getElementById("selectConductor").value = "";
  document.getElementById("ninguno").checked = true;
}

async function exportarExcelEstilizado() {
  if (datosCamiones.length === 0) {
    alert("No hay registros guardados para exportar.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Operativa Camiones");

  worksheet.mergeCells('A1:N1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = "OPERATIVA DE CAMIONES";
  tituloCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;

  const columnas = [
    { header: "CONDUCTOR", key: "conductor", width: 28 },
    { header: "PLACA", key: "placa", width: 14 },
    { header: "LICENCIA", key: "licencia", width: 14 },
    { header: "EXP", key: "exp", width: 8 },
    { header: "TEL", key: "tel", width: 14 },
    { header: "EMPRESA", key: "empresa", width: 16 },
    { header: "PRECINTO", key: "precinto", width: 16 },
    { header: "CONTENEDOR", key: "contenedor", width: 16 },
    { header: "PESO TARA", key: "tara", width: 14 },
    { header: "PESO NETO", key: "neto", width: 14 },
    { header: "PESO BRUTO", key: "bruto", width: 14 },
    { header: "LLEGÓ", key: "llego", width: 14 },
    { header: "NO LLEGÓ", key: "noLlego", width: 14 },
    { header: "OBSERVACIONES", key: "observaciones", width: 38 }
  ];

  const headerRow = worksheet.getRow(3);
  columnas.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2F5597' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  headerRow.height = 24;

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'D9D9D9' } },
    left: { style: 'thin', color: { argb: 'D9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
    right: { style: 'thin', color: { argb: 'D9D9D9' } }
  };

  datosCamiones.forEach((item, rowIndex) => {
    const currentRow = rowIndex + 4;
    const row = worksheet.getRow(currentRow);
    const llegoTexto = item.estado === "LLEGO" ? "CONFIRMADO" : "";
    const noLlegoTexto = item.estado === "NO LLEGO" ? "PENDIENTE" : "";

    const taraNum = item.tara ? parseFloat(item.tara) : "";
    const brutoNum = item.bruto ? parseFloat(item.bruto) : "";

    row.getCell(1).value = item.conductor || "";
    row.getCell(2).value = item.placa || "";
    row.getCell(3).value = item.licencia || "";
    row.getCell(4).value = item.exp || "";
    row.getCell(5).value = item.tel || "";
    row.getCell(6).value = item.empresa || "";
    row.getCell(7).value = item.precinto || "";
    row.getCell(8).value = item.contenedor || "";
    
    row.getCell(9).value = taraNum;
    row.getCell(10).value = { formula: `K${currentRow}-I${currentRow}` };
    row.getCell(11).value = brutoNum;

    row.getCell(12).value = llegoTexto;
    row.getCell(13).value = noLlegoTexto;
    row.getCell(14).value = item.observaciones || "";

    for (let c = 1; c <= 14; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      cell.font = { name: 'Arial', size: 9 };

      if (c >= 9 && c <= 11) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (c === 1 || c === 14) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      if (c === 10) {
        cell.font = { name: 'Arial', size: 9, bold: true };
      }

      if (c === 12 && llegoTexto === "CONFIRMADO") {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } };
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '375623' } };
      }
      if (c === 13 && noLlegoTexto === "PENDIENTE") {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCE4D6' } };
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'C65911' } };
      }
    }

    row.height = 24;
  });

  columnas.forEach((col, i) => {
    worksheet.getColumn(i + 1).width = col.width;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "OPERATIVA_DE_CAMIONES.xlsx";
  link.click();
}

// Asignación de Eventos al cargar el documento
document.addEventListener("DOMContentLoaded", () => {
  poblarSelect(datosCamiones);

  document.getElementById("tara").addEventListener("input", calcularPesoNeto);
  document.getElementById("bruto").addEventListener("input", calcularPesoNeto);
  document.getElementById("buscador").addEventListener("input", buscarEnTiempoReal);
  document.getElementById("selectConductor").addEventListener("change", cargarDatosDesdeSelect);

  document.getElementById("btnGuardar").addEventListener("click", guardarRegistro);
  document.getElementById("btnLimpiar").addEventListener("click", limpiarFormulario);
  document.getElementById("btnBorrar").addEventListener("click", borrarRegistro);
  document.getElementById("btnExportar").addEventListener("click", exportarExcelEstilizado);
});