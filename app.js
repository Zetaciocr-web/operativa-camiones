import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDZQ7AK_a4__wJEbD-Eay2AQ6uT4dI21LA",
  authDomain: "operativa-camiones.firebaseapp.com",
  projectId: "operativa-camiones",
  storageBucket: "operativa-camiones.firebasestorage.app",
  messagingSenderId: "401625540838",
  appId: "1:401625540838:web:9c1db7a1adabea1697327"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const coleccionCamiones = collection(db, "camiones");

let datosCamiones = [];
let registroSeleccionadoId = null;

// Escuchar cambios de sesión y cargar inmediatamente al autenticar
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Autenticado con éxito. Cargando datos...");
    await cargarDesdeFirebase();
  } else {
    console.log("Iniciando sesión anónima...");
    signInAnonymously(auth).catch((error) => console.error("Error Auth:", error));
  }
});

// 1. Cargar datos desde Firestore
async function cargarDesdeFirebase() {
  try {
    const querySnapshot = await getDocs(coleccionCamiones);
    datosCamiones = [];
    querySnapshot.forEach((docSnap) => {
      datosCamiones.push({ idFirestore: docSnap.id, ...docSnap.data() });
    });
    console.log("Registros obtenidos de Firebase:", datosCamiones.length);
    poblarSelect(datosCamiones);
  } catch (error) {
    console.error("Error al obtener datos de Firebase:", error);
  }
}

// 2. Llenar el select en la interfaz
function poblarSelect(lista) {
  // Soporta ambos IDs posibles por si el HTML varía
  const select = document.getElementById("selectConductor") || document.getElementById("selectRegistros");
  if (!select) return;

  if (lista.length === 0) {
    select.innerHTML = '<option value="">-- Sin registros guardados --</option>';
    return;
  }
  
  select.innerHTML = '<option value="">-- Seleccionar de los registros --</option>';
  lista.forEach(item => {
    const nombreConductor = item.conductor || "Sin nombre";
    const placaCamion = item.placa ? ` (${item.placa})` : "";
    select.innerHTML += `<option value="${item.idFirestore}">${nombreConductor}${placaCamion}</option>`;
  });
}

// 3. Buscar en tiempo real
function buscarEnTiempoReal() {
  const buscador = document.getElementById("buscador");
  if (!buscador) return;

  const texto = buscador.value.toLowerCase().trim();
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

  const select = document.getElementById("selectConductor") || document.getElementById("selectRegistros");
  if (filtrados.length > 0 && select) {
    select.value = filtrados[0].idFirestore;
    cargarCamionEnFormulario(filtrados[0]);
  } else {
    limpiarFormularioSinBuscador();
  }
}

// 4. Cargar datos seleccionados
function cargarDatosDesdeSelect() {
  const select = document.getElementById("selectConductor") || document.getElementById("selectRegistros");
  if (!select) return;

  const id = select.value;
  if (id === "") {
    limpiarFormularioSinBuscador();
    return;
  }
  const c = datosCamiones.find(item => item.idFirestore === id);
  if (c) cargarCamionEnFormulario(c);
}

// 5. Rellenar campos del formulario
function cargarCamionEnFormulario(c) {
  registroSeleccionadoId = c.idFirestore;
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
  
  const llegoRadio = document.getElementById("llego");
  const noLlegoRadio = document.getElementById("noLlego");
  const ningunoRadio = document.getElementById("ninguno");

  if (llegoRadio) llegoRadio.checked = (c.estado === "LLEGO");
  if (noLlegoRadio) noLlegoRadio.checked = (c.estado === "NO LLEGO");
  if (ningunoRadio) ningunoRadio.checked = (!c.estado || c.estado === "");

  calcularPesoNeto();
}

// 6. Cálculo del peso neto
function calcularPesoNeto() {
  const taraElem = document.getElementById("tara");
  const brutoElem = document.getElementById("bruto");
  const netoElem = document.getElementById("neto");

  if (!taraElem || !brutoElem || !netoElem) return;

  const tara = parseFloat(taraElem.value) || 0;
  const bruto = parseFloat(brutoElem.value) || 0;
  
  if (brutoElem.value !== "" || taraElem.value !== "") {
    const neto = bruto - tara;
    netoElem.value = neto >= 0 ? neto.toFixed(2) : "0.00";
  } else {
    netoElem.value = "";
  }
}

// 7. Guardar o actualizar registro
async function guardarRegistro() {
  const conductorInput = document.getElementById("conductor");
  const conductor = conductorInput ? conductorInput.value.trim() : "";
  
  if (!conductor) {
    alert("Por favor ingresa al menos el nombre del CONDUCTOR.");
    return;
  }

  let estadoSeleccionado = "";
  const llego = document.getElementById("llego");
  const noLlego = document.getElementById("noLlego");

  if (llego && llego.checked) estadoSeleccionado = "LLEGO";
  else if (noLlego && noLlego.checked) estadoSeleccionado = "NO LLEGO";

  calcularPesoNeto();

  const nuevoRegistro = {
    conductor: conductor,
    placa: document.getElementById("placa")?.value || "",
    licencia: document.getElementById("licencia")?.value || "",
    exp: document.getElementById("exp")?.value || "",
    tel: document.getElementById("tel")?.value || "",
    empresa: document.getElementById("empresa")?.value || "",
    precinto: document.getElementById("precinto")?.value || "",
    contenedor: document.getElementById("contenedor")?.value || "",
    tara: document.getElementById("tara")?.value || "",
    neto: document.getElementById("neto")?.value || "",
    bruto: document.getElementById("bruto")?.value || "",
    estado: estadoSeleccionado,
    observaciones: document.getElementById("observaciones")?.value || "",
    fechaActualizacion: new Date().toISOString()
  };

  try {
    if (registroSeleccionadoId !== null) {
      const docRef = doc(db, "camiones", registroSeleccionadoId);
      await updateDoc(docRef, nuevoRegistro);
      alert("¡Registro actualizado en Firebase!");
    } else {
      await addDoc(coleccionCamiones, nuevoRegistro);
      alert("¡Registro guardado en Firebase!");
    }
    await cargarDesdeFirebase();
    limpiarFormulario();
  } catch (error) {
    console.error("Error al guardar en Firebase:", error);
    alert("Ocurrió un error al guardar: " + error.message);
  }
}

// 8. Eliminar registro
async function borrarRegistro() {
  if (registroSeleccionadoId === null) {
    alert("Primero selecciona un conductor para poder borrarlo.");
    return;
  }

  const conductorNombre = document.getElementById("conductor")?.value || "";
  if (confirm(`¿Estás seguro de eliminar a: ${conductorNombre}?`)) {
    try {
      const docRef = doc(db, "camiones", registroSeleccionadoId);
      await deleteDoc(docRef);
      alert("Registro eliminado de Firebase.");
      await cargarDesdeFirebase();
      limpiarFormulario();
    } catch (error) {
      console.error("Error al borrar en Firebase:", error);
      alert("Ocurrió un error al intentar eliminar el registro.");
    }
  }
}

// 9. Limpiar formulario
function limpiarFormulario() {
  const buscador = document.getElementById("buscador");
  if (buscador) buscador.value = "";
  limpiarFormularioSinBuscador();
  poblarSelect(datosCamiones);
}

function limpiarFormularioSinBuscador() {
  registroSeleccionadoId = null;
  const form = document.getElementById("formCamion");
  if (form) form.reset();

  const select = document.getElementById("selectConductor") || document.getElementById("selectRegistros");
  if (select) select.value = "";

  const ninguno = document.getElementById("ninguno");
  if (ninguno) ninguno.checked = true;
}

// 10. Exportar a Excel
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

    const taraNum = (item.tara !== "" && item.tara !== null && item.tara !== undefined) ? parseFloat(item.tara) : 0;
    const brutoNum = (item.bruto !== "" && item.bruto !== null && item.bruto !== undefined) ? parseFloat(item.bruto) : 0;

    row.getCell(1).value = item.conductor || "";
    row.getCell(2).value = item.placa || "";
    row.getCell(3).value = item.licencia || "";
    row.getCell(4).value = item.exp || "";
    row.getCell(5).value = item.tel || "";
    row.getCell(6).value = item.empresa || "";
    row.getCell(7).value = item.precinto || "";
    row.getCell(8).value = item.contenedor || "";
    row.getCell(9).value = taraNum;
    row.getCell(10).value = { formula: `IFERROR(K${currentRow}-I${currentRow}, 0)` };
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

      if (c === 10) cell.font = { name: 'Arial', size: 9, bold: true };

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

// 11. Event Listeners
function inicializarListeners() {
  document.getElementById("tara")?.addEventListener("input", calcularPesoNeto);
  document.getElementById("bruto")?.addEventListener("input", calcularPesoNeto);
  document.getElementById("buscador")?.addEventListener("input", buscarEnTiempoReal);
  
  const select = document.getElementById("selectConductor") || document.getElementById("selectRegistros");
  select?.addEventListener("change", cargarDatosDesdeSelect);

  document.getElementById("btnGuardar")?.addEventListener("click", guardarRegistro);
  document.getElementById("btnLimpiar")?.addEventListener("click", limpiarFormulario);
  document.getElementById("btnBorrar")?.addEventListener("click", borrarRegistro);
  document.getElementById("btnExportar")?.addEventListener("click", exportarExcelEstilizado);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarListeners);
} else {
  inicializarListeners();
}