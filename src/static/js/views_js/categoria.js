$(()=>{
    cargarCategorias();
})

const tabla = $("#table-categoria").DataTable({
    language: {
        url: 'js/utils_js/jquery.datatable.spanish.json'
    },
    columns: [
        { data: 'categoryName' },
        { defaultContent: `<button type='button' name='editar' class='btn btn-primary'>
                                Editar
                                <i class="far fa-edit"></i>
                            </button>`},
        { defaultContent: `<button type='button' name='deleteButton' class='btn btn-danger'>
                                Eliminar
                                <i class="far fa-trash-alt"></i>
                            </button>`}
    ],
});

cargarCategorias = () =>{
    let xhr = new XMLHttpRequest();
    xhr.open('get','api/getCategories');
    xhr.responseType ='json';
    xhr.addEventListener('load',()=>{
        if(xhr.status === 200){
            let {data} = xhr.response;
            tabla.clear();
            tabla.rows.add(data);
            tabla.draw();
        }else{
            swal({
                title: 'Error',
                icon: 'error',
                text: 'Error al cargar las categorias.'
            })
        }
    });
    xhr.send();
}

agregarCategoria = () =>{
    event.preventDefault();
    let categoria = $("#categoria").val();
    let data = {
        categoria:categoria
    }
    Object.keys(data).map(d => $(`.${d}`).hide());
    let formData = `data=${encodeURIComponent(JSON.stringify(data))}`;
    let xhr = new XMLHttpRequest();
    xhr.open('post','api/addCategory');
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.responseType = 'json';
    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            swal({
                title: 'Éxito!',
                icon: 'success',
                text: xhr.response.msg,
                button: 'Entrar'
            })
            .then(() => {
                $('#agregarCategoria').modal('hide');
                $("#categoria").val(""); 
                tabla.rows().remove().draw();
                cargarCategorias();
            });
        } else {
            addErrorStyle(xhr.response.errors);
            swal({
                title: 'Error',
                icon: 'error',
                text: 'Revise el formulario nuevamente porfavor.'
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


$('#table-categoria').on( 'click', 'button', function ()  {
    let data = tabla.row( $(this).parents('tr') ).data();
    console.log(data)
    if($(this)[0].name == 'deleteButton') {
        swal({
            title: `Eliminar categoria`,
            icon: 'warning',
            text: `¿Está seguro/a de Eliminar la categoria "${data.categoryName}"?`,
            buttons: {
                confirm: {
                    text: 'Eliminar',
                    value: 'exec'
                },
                cancel: {
                    text: 'Cancelar',
                    value: 'cancelar',
                    visible: true
                }
            }
        })
        .then(action => {
            if(action == 'exec') {
                eliminarCategoria(data.idCategory);
            } else {
                swal.close();
            }
        })
    }else{
        window.open(`editCategoria/${data.idCategory}`, '_self');
    }
});

eliminarCategoria = (id) =>{
    let xhr = new XMLHttpRequest();
    xhr.open('delete',`api/deleteCategory/${id}`);
    xhr.responseType = 'json';
    xhr.addEventListener('load',()=>{
        if(xhr.status === 200){
            swal({
                title: 'Éxito!',
                icon: 'success',
                text: xhr.response.msg,
                button: 'Ok'
            })
            .then(() => {
                tabla.rows().remove().draw();
                cargarCategorias();
            });
        }else{
            swal({
                title: 'Error',
                icon: 'error',
                text: 'No se pudo eliminar la categoria seleccionada.'
            })
        }
    });
    xhr.send();
}

cleanInput = () =>{
    $(`.categoria`).hide()
}

$("#showModal").on('click',cleanInput)

$("#addCategory").on('click',agregarCategoria)

$("#cerrar").on('click',()=>{
    window.open('auth/logout', '_self');
})