// js/notifications.js

/**
 * Exibe uma notificação de sucesso no canto da tela (toast).
 * @param {string} message A mensagem a ser exibida.
 */
export function showSuccess(message) {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

/**
 * Exibe uma notificação de erro em um pop-up central.
 * @param {string} title O título do erro.
 * @param {string} text O texto descritivo do erro.
 */
export function showError(title, text = '') {
    Swal.fire({
        icon: 'error',
        title: title,
        text: text,
    });
}

/**
 * Exibe uma caixa de diálogo de confirmação.
 * @param {string} title O título da pergunta (ex: "Tem certeza?").
 * @param {string} text O texto de apoio (ex: "Esta ação não poderá ser revertida!").
 * @returns {Promise<Object>} Uma promessa que resolve com o resultado da interação.
 */
export function showConfirm(title, text) {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, pode continuar!',
        cancelButtonText: 'Cancelar'
    });
}