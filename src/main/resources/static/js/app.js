/* ==========================================================================
//SISTEMA DE INVENTARIO - SENA
// Lógica Unificada SPA (Conexión directa a Spring Boot / MySQL)
// Aprendiz: Deily Tatiana Suarez Rodriguez - Ficha: 3233929
   ========================================================================== */

// =====================================================
// CONFIGURACIÓN DINÁMICA DE LA URL DE LA API
// =====================================================
// En Render o en Spring Boot local, la ruta relativa "/api/productos"
// se adapta automáticamente al dominio y puerto donde se ejecute la página.
// Si se abre como archivo local sin servidor (file://), usa localhost:8081 como fallback.
const API_URL = window.location.protocol.startsWith("http")
    ? "/api/productos"
    : "http://localhost:8081/api/productos";

// Elementos del formulario
const formProducto = document.getElementById("formProducto");
const codigo = document.getElementById("codigo");
const nombre = document.getElementById("nombre");
const categoria = document.getElementById("categoria");
const precio = document.getElementById("precio");
const cantidad = document.getElementById("cantidad");
const proveedor = document.getElementById("proveedor");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const btnLimpiar = document.getElementById("btnLimpiar");
const tituloFormulario = document.getElementById("tituloFormulario");
const mensajeContenedor = document.getElementById("mensaje");

// Elementos de la tabla
const tbodyProductos = document.getElementById("tablaProductos");
const totalGeneral = document.getElementById("totalGeneral");

// Elementos de estadísticas
const totalProductos = document.getElementById("totalProductos");
const productosStock = document.getElementById("productosStock");
const productosAgotados = document.getElementById("productosAgotados");
const valorInventario = document.getElementById("valorInventario");

// Elementos de búsqueda y filtro
const buscarProducto = document.getElementById("buscarProducto");
const filtroCategoria = document.getElementById("filtroCategoria");

// Estado de la aplicación
let productoEditandoId = null;
let todosLosProductos = [];


// =====================================================
// NAVEGACIÓN UNIFICADA DE SECCIONES (SPA)
// =====================================================

function mostrarSeccion(nombreSeccion) {
    // 1. Ocultar todas las secciones
    const secciones = document.querySelectorAll(".seccion-vista");
    secciones.forEach(sec => sec.classList.remove("activa"));

    // 2. Desactivar todos los enlaces del menú
    const links = document.querySelectorAll(".navbar-nav .nav-link");
    links.forEach(l => l.classList.remove("active"));

    // 3. Activar la sección seleccionada
    const seccionActiva = document.getElementById(`seccion-${nombreSeccion}`);
    if (seccionActiva) {
        seccionActiva.classList.add("activa");
    }

    // 4. Activar el enlace del menú correspondiente
    const linkActivo = document.getElementById(`nav-${nombreSeccion}`);
    if (linkActivo) {
        linkActivo.classList.add("active");
    }

    // 5. Acciones específicas al entrar a cada sección
    if (nombreSeccion === "productos") {
        mostrarProductos();
    } else if (nombreSeccion === "inicio") {
        cargarEstadisticas();
    }

    // 6. Desplazar la vista suavemente arriba
    window.scrollTo({ top: 0, behavior: "smooth" });
}


// =====================================================
// SISTEMA DE ALERTAS VISUALES DINÁMICAS
// =====================================================

function mostrarAlerta(texto, tipo = "success", duracion = 5000) {
    if (!mensajeContenedor) return;

    const iconos = {
        success: "bi-check-circle-fill",
        danger: "bi-exclamation-triangle-fill",
        warning: "bi-exclamation-circle-fill",
        info: "bi-info-circle-fill"
    };

    const icono = iconos[tipo] || "bi-info-circle-fill";

    mensajeContenedor.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show shadow-sm rounded-3 d-flex align-items-center mb-4" role="alert">
            <i class="bi ${icono} fs-4 me-3"></i>
            <div class="flex-grow-1">${texto}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        </div>
    `;

    if (duracion > 0) {
        setTimeout(() => {
            const alerta = mensajeContenedor.querySelector(".alert");
            if (alerta) {
                alerta.classList.remove("show");
                setTimeout(() => alerta.remove(), 200);
            }
        }, duracion);
    }
}


// =====================================================
// VERIFICAR ESTADO DE CONEXIÓN CON SPRING BOOT / MYSQL
// =====================================================

async function verificarConexionServidor() {
    const badge = document.getElementById("badgeConexion");
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const respuesta = await fetch(API_URL, { method: "GET", signal: controller.signal });
        clearTimeout(timeoutId);

        if (respuesta.ok && badge) {
            badge.className = "badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill";
            badge.innerHTML = '<i class="bi bi-database-check me-1"></i> Conectado a MySQL';
        }
    } catch (e) {
        if (badge) {
            badge.className = "badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill";
            badge.innerHTML = '<i class="bi bi-database-exclamation me-1"></i> Servidor Desconectado';
        }
        // En Render gratuito, la primera petición puede tardar unos segundos en despertar el servidor.
        // Reintentamos automáticamente una vez después de 4 segundos:
        setTimeout(async () => {
            try {
                const r = await fetch(API_URL);
                if (r.ok && badge) {
                    badge.className = "badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill";
                    badge.innerHTML = '<i class="bi bi-database-check me-1"></i> Conectado a MySQL';
                    cargarEstadisticas();
                    mostrarProductos();
                }
            } catch (_) {}
        }, 4000);
    }
}


// =====================================================
// CONSULTAR PRODUCTOS DESDE SPRING BOOT (MYSQL)
// =====================================================

async function obtenerProductos() {
    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const data = await respuesta.json();
        verificarConexionServidor();
        return data;

    } catch (error) {
        console.error("Error al consultar productos desde la API:", error);
        mostrarAlerta(
            "<strong>Aviso:</strong> No se pudo conectar con el servidor Spring Boot / MySQL. Asegúrese de haber iniciado la aplicación con <code>.\\mvnw.cmd spring-boot:run</code>.",
            "danger",
            0
        );
        verificarConexionServidor();
        return [];
    }
}


// =====================================================
// MOSTRAR PRODUCTOS EN LA TABLA
// =====================================================

async function mostrarProductos() {
    if (!tbodyProductos) return;

    tbodyProductos.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                Cargando datos desde MySQL...
            </td>
        </tr>
    `;

    const productos = await obtenerProductos();
    todosLosProductos = productos;
    renderizarTabla(productos);
}


// =====================================================
// RENDERIZAR TABLA CON PRODUCTOS
// =====================================================

function renderizarTabla(productos) {
    if (!tbodyProductos) return;

    tbodyProductos.innerHTML = "";
    let sumaTotalGeneral = 0;

    if (!productos || productos.length === 0) {
        tbodyProductos.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5 text-muted">
                    <i class="bi bi-box-seam fs-1 d-block mb-2 text-secondary"></i>
                    No hay productos registrados en la base de datos.<br>
                    <button class="btn btn-sm btn-primary mt-2" onclick="mostrarSeccion('registrar')">
                        <i class="bi bi-plus-circle me-1"></i> Registrar el primer producto
                    </button>
                </td>
            </tr>
        `;
        if (totalGeneral) totalGeneral.textContent = "$0";
        return;
    }

    productos.forEach(function(producto) {
        const precioUnitario = Number(producto.precio) || 0;
        const existencias = Number(producto.cantidad) || 0;
        const total = precioUnitario * existencias;
        sumaTotalGeneral += total;

        const estado = existencias > 0 ? "Disponible" : "Agotado";
        const claseEstado = existencias > 0 ? "bg-success" : "bg-danger";

        const fila = `
            <tr>
                <td class="fw-semibold text-primary"><i class="bi bi-upc me-1"></i>${producto.codigo || ""}</td>
                <td class="fw-bold">${producto.nombre || ""}</td>
                <td><span class="badge bg-light text-dark border">${producto.categoria || "Sin categoría"}</span></td>
                <td><i class="bi bi-building me-1 text-muted"></i>${producto.proveedor || "N/A"}</td>
                <td>$${precioUnitario.toLocaleString("es-CO")}</td>
                <td><span class="badge bg-secondary-subtle text-dark px-2 py-1">${existencias}</span></td>
                <td class="fw-semibold text-dark">$${total.toLocaleString("es-CO")}</td>
                <td>
                    <span class="badge ${claseEstado} px-2 py-1">
                        ${estado}
                    </span>
                </td>
                <td class="text-center">
                    <button
                        class="btn btn-outline-warning btn-sm me-1"
                        title="Editar producto"
                        onclick="editarProducto(${producto.id})">
                        <i class="bi bi-pencil-square"></i> Editar
                    </button>

                    <button
                        class="btn btn-outline-danger btn-sm"
                        title="Eliminar producto"
                        onclick="eliminarProducto(${producto.id})">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </td>
            </tr>
        `;

        tbodyProductos.innerHTML += fila;
    });

    if (totalGeneral) {
        totalGeneral.textContent = "$" + sumaTotalGeneral.toLocaleString("es-CO");
    }
}


// =====================================================
// REGISTRAR O ACTUALIZAR PRODUCTO (PERSISTENCIA EN MYSQL)
// =====================================================

if (formProducto) {
    formProducto.addEventListener("submit", async function(event) {
        event.preventDefault();

        // Validaciones
        const codVal = codigo.value.trim();
        const nomVal = nombre.value.trim();
        const catVal = categoria.value;
        const preVal = parseFloat(precio.value);
        const canVal = parseInt(cantidad.value);
        const proVal = proveedor.value.trim();

        if (!codVal || !nomVal || !catVal || isNaN(preVal) || isNaN(canVal) || !proVal) {
            mostrarAlerta("Por favor complete todos los campos obligatorios del formulario.", "warning");
            return;
        }

        const producto = {
            codigo: codVal,
            nombre: nomVal,
            categoria: catVal,
            precio: preVal,
            cantidad: canVal,
            proveedor: proVal
        };

        // Deshabilitar botón durante el envío
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Guardando en MySQL...';

        try {
            let respuesta;

            if (productoEditandoId === null) {
                // REGISTRAR PRODUCTO NUEVO (POST)
                respuesta = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify(producto)
                });
            } else {
                // ACTUALIZAR PRODUCTO EXISTENTE (PUT)
                respuesta = await fetch(`${API_URL}/${productoEditandoId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify(producto)
                });
            }

            if (!respuesta.ok) {
                const errorTexto = await respuesta.text();
                throw new Error(errorTexto || `Error HTTP ${respuesta.status}`);
            }

            const productoGuardado = await respuesta.json();

            // Mensaje de éxito
            const accion = productoEditandoId === null ? "registrado" : "actualizado";
            mostrarAlerta(
                `<strong>¡Éxito!</strong> El producto <strong>"${productoGuardado.nombre}"</strong> fue ${accion} correctamente en la base de datos MySQL.`,
                "success",
                6000
            );

            // Reiniciar formulario y estado
            formProducto.reset();
            cancelarEdicion();

            // Actualizar datos en segundo plano
            await mostrarProductos();
            await cargarEstadisticas();

        } catch (error) {
            console.error("ERROR REAL AL GUARDAR PRODUCTO:", error);

            let mensajeError = error.message || "Error desconocido";

            try {
                if (mensajeError.trim().startsWith("{")) {
                    const errorJSON = JSON.parse(mensajeError);

                    mensajeError =
                        errorJSON.message ||
                        errorJSON.error ||
                        errorJSON.errorMessage ||
                        mensajeError;
                }
            } catch (e) {
                console.warn("La respuesta del servidor no es JSON:", e);
            }

            mostrarAlerta(
                `<strong>Error al guardar:</strong><br>${mensajeError}`,
                "danger",
                15000
            );
        } finally {
            btnGuardar.disabled = false;
            if (productoEditandoId === null) {
                btnGuardar.innerHTML = '<i class="bi bi-check-circle me-1"></i> Guardar producto';
            } else {
                btnGuardar.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Actualizar producto';
            }
        }
    });
}


// =====================================================
// EDITAR PRODUCTO (CARGAR EN FORMULARIO IN-SITU)
// =====================================================

async function editarProducto(id) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}`);

        if (!respuesta.ok) {
            throw new Error("Producto no encontrado");
        }

        const producto = await respuesta.json();

        // 1. Asignar datos a los campos del formulario
        productoEditandoId = producto.id;
        codigo.value = producto.codigo || "";
        nombre.value = producto.nombre || "";
        categoria.value = producto.categoria || "";
        precio.value = producto.precio || 0;
        cantidad.value = producto.cantidad || 0;
        proveedor.value = producto.proveedor || "";

        // 2. Modificar UI para modo edición
        if (tituloFormulario) {
            tituloFormulario.innerHTML = `<i class="bi bi-pencil-square me-2 text-warning"></i>Editando Producto: <span class="text-dark">${producto.nombre}</span>`;
        }

        if (btnGuardar) {
            btnGuardar.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Actualizar producto';
            btnGuardar.classList.remove("btn-success");
            btnGuardar.classList.add("btn-warning", "text-dark");
        }

        if (btnCancelar) {
            btnCancelar.style.display = "inline-block";
        }

        // 3. Pasar a la pestaña de registro sin recargar la página
        mostrarSeccion("registrar");

    } catch (error) {
        console.error("Error al cargar producto para editar:", error);
        mostrarAlerta("No fue posible cargar los datos del producto para edición.", "danger");
    }
}


// =====================================================
// CANCELAR EDICIÓN
// =====================================================

function cancelarEdicion() {
    productoEditandoId = null;

    if (formProducto) {
        formProducto.reset();
    }

    if (tituloFormulario) {
        tituloFormulario.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Registrar Nuevo Producto';
    }

    if (btnGuardar) {
        btnGuardar.innerHTML = '<i class="bi bi-check-circle me-1"></i> Guardar producto';
        btnGuardar.classList.remove("btn-warning", "text-dark");
        btnGuardar.classList.add("btn-success");
    }

    if (btnCancelar) {
        btnCancelar.style.display = "none";
    }
}

if (btnCancelar) {
    btnCancelar.addEventListener("click", cancelarEdicion);
}


// =====================================================
// ELIMINAR PRODUCTO (BORRADO DIRECTO EN MYSQL)
// =====================================================

async function eliminarProducto(id) {
    const confirmar = confirm("¿Está seguro de que desea eliminar este producto de la base de datos?");
    if (!confirmar) return;

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!respuesta.ok) {
            throw new Error("No fue posible eliminar el producto");
        }

        mostrarAlerta("Producto eliminado exitosamente de la base de datos MySQL.", "success");

        // Actualizar tabla y estadísticas
        await mostrarProductos();
        await cargarEstadisticas();

    } catch (error) {
        console.error("Error al eliminar producto:", error);
        mostrarAlerta("No fue posible eliminar el producto en el servidor.", "danger");
    }
}


// =====================================================
// ESTADÍSTICAS DEL INVENTARIO EN TIEMPO REAL
// =====================================================

async function cargarEstadisticas() {
    if (!totalProductos) return;

    const productos = await obtenerProductos();

    let disponibles = 0;
    let agotados = 0;
    let valorTotal = 0;

    productos.forEach(function(producto) {
        const cant = Number(producto.cantidad) || 0;
        const prec = Number(producto.precio) || 0;

        if (cant > 0) {
            disponibles++;
        } else {
            agotados++;
        }
        valorTotal += prec * cant;
    });

    totalProductos.textContent = productos.length;
    if (productosStock) productosStock.textContent = disponibles;
    if (productosAgotados) productosAgotados.textContent = agotados;
    if (valorInventario) valorInventario.textContent = "$" + valorTotal.toLocaleString("es-CO");
}


// =====================================================
// BÚSQUEDA Y FILTRADO EN TIEMPO REAL
// =====================================================

function filtrarProductos() {
    const textoBusqueda = buscarProducto ? buscarProducto.value.trim().toLowerCase() : "";
    const categoriaSeleccionada = filtroCategoria ? filtroCategoria.value : "";

    let productosFiltrados = todosLosProductos;

    if (textoBusqueda) {
        productosFiltrados = productosFiltrados.filter(function(producto) {
            return (
                (producto.codigo || "").toLowerCase().includes(textoBusqueda) ||
                (producto.nombre || "").toLowerCase().includes(textoBusqueda) ||
                (producto.proveedor || "").toLowerCase().includes(textoBusqueda)
            );
        });
    }

    if (categoriaSeleccionada) {
        productosFiltrados = productosFiltrados.filter(function(producto) {
            return producto.categoria === categoriaSeleccionada;
        });
    }

    renderizarTabla(productosFiltrados);
}

if (buscarProducto) {
    buscarProducto.addEventListener("input", filtrarProductos);
}

if (filtroCategoria) {
    filtroCategoria.addEventListener("change", filtrarProductos);
}


// =====================================================
// SOPORTE DE HASH EN URL (#productos, #registrar)
// =====================================================

function verificarHashUrl() {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (hash === "productos" || hash === "seccion-productos") {
        mostrarSeccion("productos");
    } else if (hash === "registrar" || hash === "seccion-registrar") {
        mostrarSeccion("registrar");
    } else {
        mostrarSeccion("inicio");
    }
}

window.addEventListener("hashchange", verificarHashUrl);


// =====================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    verificarHashUrl();
    verificarConexionServidor();
    cargarEstadisticas();
});
