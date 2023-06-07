$(()=>{
    getDataCategory();
});


getDataCategory = () =>{
    let id = $("#titulo").attr("name");
    let xhr = new XMLHttpRequest();
    xhr.open('get',`../api/getDataCategory/${id}`);
    xhr.responseType = "json";
    xhr.addEventListener('load',()=>{
        if(xhr.status === 200){
            let {data} = xhr.response;
            $("#titulo").val(data.categoryName)
        }else{
            swal({
                title: 'Error',
                icon: 'error',
                text: 'No se pudo obtener los datos la categoria.'
            })
        }
    });
    xhr.send();
}

editCategory = () =>{
    let name = $("#titulo").val();
    let id = $("#titulo").attr("name");
    let datos = {
        categoria:name,
        id:id
    }
    let formData = `data=${encodeURIComponent(JSON.stringify(datos))}`;
    let xhr = new XMLHttpRequest();
    xhr.open('put',`../api/editCategory`);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.responseType = "json";
    xhr.addEventListener('load',()=>{
        if(xhr.status === 200){
            swal({
                title: 'Éxito!',
                icon: 'success',
                text: xhr.response.msg,
                button: 'Entrar'
            })
            .then(()=>{
                window.open(`../list`, '_self');
            })
        }else{
            addErrorStyle(xhr.response.errors);
            swal({
                title: 'Error',
                icon: 'error',
                text: 'No se pudo actualizar la categoria.'
            })
        }
    });
    xhr.send(formData);
}

addErrorStyle = (errores) => {
    let arrayErrores = Object.keys(errores);
    arrayErrores.map(err => {
        let x =$(`.${err}`).show();
        console.log(x)
    });
}

$("#editarCategoria").on('click',editCategory)