var express = require('express');
var router = express.Router();

import client from './postgres';


router.get('/addProduct', function (req, res) {
	if (req.session.loggedin && (req.session.typeUser == 'inventario' || req.session.typeUser == 'administrador')) {
		res.render('AgregarProducto', { sesion: req.session });
	} else {
		req.session.loggedin = false;
		res.render('Login', { restipo: "warning", resultado: "Sesión cerrada por actividad sin permisos" });
	}
	res.end();
});

router.get('/editProduct', function (req, res) {
	if (req.session.loggedin && (req.session.typeUser == 'inventario' || req.session.typeUser == 'administrador')) {
		client.query('SELECT * from producto where codigo = $1', [req.query.id], function (err, rs) {
			if (rs.rows[0].habilitado == 'N') {
				res.redirect('/listProducts');
			}
			else {
				if (rs.rows[0].tipo == "comestible") {
					client.query("select * from producto pr, comestible pc where pr.codigo = $1 and pr.codigo = pc.ccodigo", [rs.rows[0].codigo],
						function (err, rescom) {
							if (err) {
								throw err;
							}
							else {
								res.render('EditarProducto', { producto: rescom.rows[0], sesion: req.session });
								res.end();
							}
						});
				}
				else {
					client.query("select * from producto pr, nocomestible pn where pr.codigo = $1 and pr.codigo = pn.nccodigo", [rs.rows[0].codigo],
						function (err, resncom) {
							if (err) {
								throw err;
							}
							else {
								res.render('EditarProducto', { producto: resncom.rows[0], sesion: req.session });
								res.end();
							}
						});
				}

			}
		});

	} else {
		req.session.loggedin = false;
		res.render('Login', { restipo: "warning", resultado: "Sesión cerrada por actividad sin permisos" });
		res.end();
	}

});

router.get('/listProducts', function (req, res) {
	if (req.session.loggedin && (req.session.typeUser == 'inventario' || req.session.typeUser == 'administrador')) {
		var sql = "SELECT * from producto where habilitado = 'S'"

		client.query(sql, function (err, result) {
			if (err) {
				throw err;
			}
			else {
				res.render('ListaProd', { restipo: "success", resultado: "", productos: result, sesion: req.session });
				res.end();
			}

		});
	} else {
		req.session.loggedin = false;
		res.render('Login', { restipo: "warning", resultado: "Sesión cerrada por actividad sin permisos" });
	}
});


router.post('/addProduct', async function (req, res) {
	var sql = "SELECT * from producto where habilitado = 'S'"
	var result = await client.query(sql)

	var cod = req.body.cod;
	var nombre = req.body.name;
	var marca = req.body.marca;
	var stockact = req.body.stock;
	var stockmin = req.body.stock_min;
	var precio = req.body.precio;
	var fechaelab = "";
	var fechavenc = "";

	var tipo = req.body.seleccion;
	if (tipo == 'comestible') {
		fechaelab = req.body.elaboracion;
		fechavenc = req.body.vencimiento;
		if (fechaelab == "" || fechavenc == "") {
			return res.redirect('/listProducts');
		}
	};
	var tipoProducto = req.body.selecciontipo;

	client.query('SELECT * FROM public.producto WHERE codigo=$1', [cod], function (err, resultsq1, fields) {
		if (resultsq1.rows[0] == undefined) {
			client.query("INSERT INTO public.producto VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
				[cod, nombre, marca, stockact, stockmin, precio, tipo, 'S'], function (err, resultsq2, fields) {
					if (err) {
						res.render('ListaProd', { restipo: "danger", resultado: "No se pudo agregar el producto", productos: result, sesion: req.session });
					}
				});
			if (tipo == "comestible") {
				client.query("INSERT INTO public.comestible VALUES ($1, $2, $3)",
					[cod, fechaelab, fechavenc], async function (err, resultsq2, fields) {
						result = await client.query(sql)
						if (err) {
							res.render('ListaProd', { restipo: "danger", resultado: "No se pudo agregar el producto comestible", productos: result, sesion: req.session });
						} else {
							res.render('ListaProd', { restipo: "success", resultado: "Se ha registrado con éxito el producto comestible", productos: result, sesion: req.session });
						}
					});
			} else {
				client.query("INSERT INTO public.nocomestible VALUES ($1, $2)",
					[cod, tipoProducto], async function (err, resultsq2, fields) {
						result = await client.query(sql)
						if (err) {
							res.render('ListaProd', { restipo: "danger", resultado: "No se pudo agregar el producto no comestible", productos: result, sesion: req.session });
						} else {
							res.render('ListaProd', { restipo: "success", resultado: "Se ha registrado con éxito el producto no comestible", productos: result, sesion: req.session });
						}
					});
			}
		}
		else {
			//Agregar caracter
			var codedit = cod + 'a';
			client.query("INSERT INTO public.producto VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
				[codedit, nombre, marca, stockact, stockmin, precio, tipo, 'S'], function (err, resultsq2, fields) {
					if (err) {
						res.render('ListaProd', { restipo: "danger", resultado: "No se pudo registrar el producto", productos: result, sesion: req.session });
					}
				});
			if (tipo == "comestible") {
				client.query("INSERT INTO public.comestible VALUES ($1, $2, $3)",
					[codedit, fechaelab, fechavenc], async function (err, resultsq2, fields) {
						result = await client.query(sql)
						if (err) {
							res.render('ListaProd', { restipo: "danger", resultado: "No se pudo registrar el producto comestible", productos: result, sesion: req.session });
						}
					});
			} else {
				client.query("INSERT INTO public.nocomestible VALUES ($1, $2)",
					[codedit, tipoProducto], async function (err, resultsq2, fields) {
						result = await client.query(sql)
						if (err) {
							res.render('ListaProd', { restipo: "danger", resultado: "No se pudo agregar el producto no comestible", productos: result, sesion: req.session });
						}
					});
			}
			client.query("UPDATE producto set habilitado = 'N' where codigo = $1", [cod], async function (err, res2, fields) {
				result = await client.query(sql)
				if (err) {
					res.render('ListaProd', { restipo: "danger", resultado: "No se pudo deshabilitar el producto pre-editado", productos: result, sesion: req.session });
				}
				else {
					res.render('ListaProd', { restipo: "success", resultado: "Se ha editado con éxito el producto", productos: result, sesion: req.session });
				}
			});
		}
	});
});

export default router;