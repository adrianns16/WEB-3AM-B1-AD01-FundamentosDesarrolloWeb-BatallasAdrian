// script.js

const usuarios = [
    { username: 'Adrian', password: '123', role: 'cliente' },
    { username: 'Isaac', password: '123', role: 'cliente' },
    { username: 'Marlon', password: '123', role: 'cliente' },
    { username: 'Administrador', password: 'admin', role: 'admin' }
];

let currentUser = null;
let registrosMantenimiento = JSON.parse(localStorage.getItem('mamelodi_db')) || [];

const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const userDisplay = document.getElementById('userDisplay');
const navAdmin = document.getElementById('navAdmin');

document.addEventListener('DOMContentLoaded', () => {
    const anioSelect = document.getElementById('anio');
    if(anioSelect) {
        const currentYear = new Date().getFullYear();
        for(let i = currentYear; i >= 1990; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            anioSelect.appendChild(option);
        }
    }
});

// Login
document.getElementById('formLogin').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userValue = document.getElementById('loginUser').value.trim();
    const passValue = document.getElementById('loginPass').value;

    const usuarioEncontrado = usuarios.find(
        u => u.username.toLowerCase() === userValue.toLowerCase() && u.password === passValue
    );

    if (usuarioEncontrado) {
        currentUser = usuarioEncontrado;
        loginSection.classList.add('d-none');
        appSection.classList.remove('d-none');
        
        userDisplay.innerHTML = `<i class="fa-solid fa-user me-2"></i> ${currentUser.username}`;
        
        if (currentUser.role === 'admin') {
            navAdmin.classList.remove('d-none');
            showView('adminPanel');
        } else {
            navAdmin.classList.add('d-none');
            showView('inicio');
        }
        
        this.reset();
        
        // Alerta de Bienvenida
        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 2000,
            background: '#141923', color: '#fff'
        });
        Toast.fire({ icon: 'success', title: `¡Bienvenido ${currentUser.username}!` });
        
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: 'Usuario o contraseña incorrectos.',
            confirmButtonColor: '#00f2fe',
            background: '#141923', color: '#fff'
        });
    }
});

function logout() {
    Swal.fire({
        title: '¿Cerrar Sesión?',
        text: "¿Estás seguro que deseas salir del portal?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ff4d4d',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar',
        background: '#141923',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            currentUser = null;
            appSection.classList.add('d-none');
            loginSection.classList.remove('d-none');
            
            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 2000,
                background: '#141923', color: '#fff'
            });
            Toast.fire({ icon: 'info', title: 'Sesión cerrada' });
        }
    });
}

function showView(viewId) {
    if (viewId === 'adminPanel' && currentUser.role !== 'admin') {
        Swal.fire({
            title: 'Acceso Prohibido',
            text: 'No tienes los permisos necesarios de Administrador.',
            icon: 'error',
            confirmButtonColor: '#ff4d4d',
            background: '#141923', color: '#fff'
        });
        return;
    }

    document.querySelectorAll('.view-section').forEach(el => el.classList.add('d-none'));
    document.getElementById(`view-${viewId}`).classList.remove('d-none');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.style.background = 'rgba(255,255,255,0.02)');
    const clickedBtn = document.querySelector(`a[onclick="showView('${viewId}')"]`);
    if(clickedBtn && !clickedBtn.classList.contains('btn-warning')) {
        clickedBtn.style.background = 'rgba(0, 242, 254, 0.15)';
        clickedBtn.style.borderColor = '#00f2fe';
    }

    if (viewId === 'misSolicitudes') renderTablaCliente();
    if (viewId === 'adminPanel') renderTablaAdmin();
}

document.getElementById('formSolicitud').addEventListener('submit', function(e) {
    e.preventDefault();
    
    Swal.fire({
        title: '¿Confirmar Cita?',
        text: "Por favor, verifica que los datos de tu vehículo y el servicio sean correctos antes de agendar.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#00f2fe',
        cancelButtonColor: '#ff4d4d',
        confirmButtonText: 'Sí, agendar cita',
        cancelButtonText: 'Revisar datos',
        background: '#141923',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            
            let extras = [];
            if(document.getElementById('lavado').checked) extras.push('Lavado');
            if(document.getElementById('aspirado').checked) extras.push('Aspirado');

            const dejaLlaves = document.querySelector('input[name="llaves"]:checked').value;

            const nuevoRegistro = {
                id: Date.now(),
                cliente: currentUser.username,
                placa: document.getElementById('placa').value.toUpperCase(),
                marca: document.getElementById('marca').value,
                modelo: document.getElementById('modelo').value,
                anio: document.getElementById('anio').value,
                kilometraje: document.getElementById('kilometraje').value,
                tipoServicio: document.getElementById('tipoServicio').value,
                fecha: document.getElementById('fecha').value,
                hora: document.getElementById('hora').value,
                dejaLlaves: dejaLlaves,
                extras: extras.join(', '),
                observaciones: document.getElementById('observaciones').value,
                estado: 'Pendiente'
            };

            registrosMantenimiento.push(nuevoRegistro);
            guardarEnLocalStorage();

            Swal.fire({
                icon: 'success',
                title: '¡Cita Registrada!',
                text: 'Tu solicitud ha sido agendada en MamelodiSundays exitosamente.',
                confirmButtonColor: '#00f2fe',
                background: '#141923', color: '#fff'
            });

            this.reset();
            showView('misSolicitudes');
        }
    });
});

function renderTablaCliente() {
    const tbody = document.getElementById('tablaMisSolicitudes');
    tbody.innerHTML = '';
    
    const misRegistros = registrosMantenimiento.filter(reg => reg.cliente === currentUser.username);
    
    if (misRegistros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-5 fs-5">Aún no has registrado ningún mantenimiento.</td></tr>`;
        return;
    }

    misRegistros.forEach(s => {
        let badgeColor = obtenerColorEstado(s.estado);
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold text-info">#${s.id}</td>
                <td>
                    <strong class="text-white">${s.marca} ${s.modelo}</strong> <br>
                    <span class="badge border border-secondary text-secondary bg-transparent mt-1">${s.placa}</span>
                </td>
                <td class="text-white">${s.tipoServicio}</td>
                <td class="text-white"><i class="fa-regular fa-calendar text-info"></i> ${s.fecha} <br> <i class="fa-regular fa-clock text-info mt-1"></i> ${s.hora}</td>
                <td><span class="badge ${badgeColor} fs-6 border">${s.estado}</span></td>
            </tr>
        `;
    });
}

function renderTablaAdmin() {
    const tbody = document.getElementById('tablaAdmin');
    tbody.innerHTML = '';

    if (registrosMantenimiento.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5 fs-5">No hay solicitudes en el sistema.</td></tr>`;
        return;
    }

    registrosMantenimiento.forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td class="text-info small">#${s.id}</td>
                <td class="fw-bold text-white"><i class="fa-solid fa-user text-info"></i> ${s.cliente}</td>
                <td class="text-white">
                    ${s.marca} ${s.modelo} (${s.anio})<br>
                    <span class="badge border border-secondary text-secondary bg-transparent mt-1">${s.placa}</span> - ${s.kilometraje} km
                </td>
                <td class="text-white">
                    <strong>${s.tipoServicio}</strong><br>
                    <small class="text-info"><i class="fa-regular fa-calendar"></i> ${s.fecha} - ${s.hora}</small><br>
                    ${s.extras ? `<small class="text-secondary">Extras: ${s.extras}</small>` : ''}
                </td>
                <td>
                    <select class="form-select form-select-sm" style="background-color: rgba(0,0,0,0.5); border-color: rgba(255,255,255,0.2); color: white;" onchange="cambiarEstado(${s.id}, this.value)">
                        <option value="Pendiente" ${s.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="En revisión" ${s.estado === 'En revisión' ? 'selected' : ''}>En revisión</option>
                        <option value="En proceso" ${s.estado === 'En proceso' ? 'selected' : ''}>En proceso</option>
                        <option value="Finalizado" ${s.estado === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                        <option value="Cancelado" ${s.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarSolicitud(${s.id})" title="Eliminar Registro">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function cambiarEstado(id, nuevoEstado) {
    const index = registrosMantenimiento.findIndex(s => s.id === id);
    if (index !== -1) {
        registrosMantenimiento[index].estado = nuevoEstado;
        guardarEnLocalStorage();
        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 2000,
            background: '#141923', color: '#fff'
        });
        Toast.fire({ icon: 'success', title: 'Estado actualizado' });
    }
}

function eliminarSolicitud(id) {
    Swal.fire({
        title: '¿Eliminar registro?',
        text: "Esta acción es irreversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff4d4d',
        cancelButtonColor: '#4facfe',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#141923',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            registrosMantenimiento = registrosMantenimiento.filter(s => s.id !== id);
            guardarEnLocalStorage();
            renderTablaAdmin();
            Swal.fire({
                title: '¡Eliminado!', 
                text: 'El registro ha sido eliminado del sistema.', 
                icon: 'success',
                background: '#141923',
                color: '#fff'
            });
        }
    });
}

function guardarEnLocalStorage() {
    localStorage.setItem('mamelodi_db', JSON.stringify(registrosMantenimiento));
}

function obtenerColorEstado(estado) {
    switch (estado) {
        case 'Pendiente': return 'bg-transparent text-secondary border-secondary';
        case 'En revisión': return 'bg-info bg-opacity-25 text-info border-info';
        case 'En proceso': return 'bg-warning bg-opacity-25 text-warning border-warning';
        case 'Finalizado': return 'bg-success bg-opacity-25 text-success border-success';
        case 'Cancelado': return 'bg-danger bg-opacity-25 text-danger border-danger';
        default: return 'bg-transparent text-secondary border-secondary';
    }
}
