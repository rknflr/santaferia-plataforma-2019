$(()=>{
    $("#rut").rut({
        minimumLength: 8,
        validateOn: 'change'
    });
});


login = () =>{
    event.preventDefault();
    let rut = $("#rut").val();
    let password = $("#password").val();
    rut = encodeURIComponent(rut);
    password = encodeURIComponent(password);
    let formData = `user_id=${rut}&password=${password}`;
    let xhr = new XMLHttpRequest();
    xhr.open('post', 'auth/login');
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.responseType = 'json';
    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            swal({
                title: 'Éxito!',
                icon: 'success',
                text: xhr.response.message,
                button: 'Entrar'
            })
            .then(() => {
                window.open('list', '_self');
            });
        } else {
            swal({
                title: 'Error',
                icon: 'warning',
                text: 'Rut o contraseña incorrectos.'
            });
        }
    });
    xhr.send(formData);
};

$("#login").on('click',login);