var express = require('express');
var router = express.Router();

import client from './postgres';

router.get('/makeSale', async function (req, res) {
	if (req.session.loggedin && (req.session.typeUser == 'ventas' || req.session.typeUser == 'administrador')) {
		var products = await client.query('SELECT * from PRODUCTO');
		res.render('RealizarVenta', { productos: products, sesion: req.session });
	} else {
		req.session.loggedin = false;
		res.render('Login', {restipo: "warning",resultado: "Sesión cerrada por actividad sin permisos"});
	}
	res.end();
});

router.get('/listSales', function (req, res, next) {
	if (req.session.loggedin && (req.session.typeUser == 'ventas' || req.session.typeUser == 'administrador')) {
		var sql = "select * from ventas";

		client.query(sql, function (err, result) {
			if (err) {
				throw err;
			}
			else {
				res.render('ListaVentas.ejs', {restipo: "success",resultado: "", sales: result, sesion: req.session });
				res.end();
			}

		});
	} else {
		req.session.loggedin = false;
		res.render('Login', {restipo: "warning",resultado: "Sesión cerrada por actividad sin permisos"});
	}
});

router.get('/detailSale', function (req, res) {
	if (req.session.loggedin && (req.session.typeUser == 'administrador' || req.session.typeUser == 'ventas')) {
		client.query('SELECT * FROM ventas, productoventas, producto WHERE producto.codigo = productoventas.codigop AND ventas.codigo = productoventas.codigov AND ventas.codigo = $1', [req.query.detven], function (err, rs) {
			if (err) {
				throw err;
			} else {
				res.render('detalleVTAFix.ejs', { salesdet: rs, sesion: req.session });
			}
		});
	} else {
		req.session.loggedin = false;
		res.render('Login', {restipo: "warning",resultado: "Sesión cerrada por actividad sin permisos"});
		res.end();
	}
});


router.post('/makeSale', function (req, res) {
	var ventID = req.body.ventaID;
	if (ventID == "undefined") {
		res.redirect('/makeSale')
	}
	else {
		var tot_mon = req.body.totalmonto;
		var fecha = req.body.fechahoy;
		var sel_pago = req.body.sel_pago;
		var prodVentas = req.body.prodsVenta;

		client.query("SELECT * from ventas where codigo= $1", [ventID], function (err, resq1) {
			if (resq1.rows[0] == undefined) {
				client.query('INSERT into ventas values($1, $2, $3, $4)', [ventID, tot_mon, sel_pago, fecha],
					async function (err, resq2) {
						var sql = "select * from ventas"
						var result = await client.query(sql);
						if (err) {
							res.render('ListaVentas.ejs', {restipo: "danger", resultado: "La venta no pudo ser registrada", sales: result, sesion: req.session });
						}
						else {
							client.query(prodVentas, function (err, resq3, fields) {
								if (err) {
									res.render('ListaVentas.ejs', {restipo: "danger", resultado: "No se insertaron los productos de la venta", sales: result, sesion: req.session });
								}
								else {
									res.render('ListaVentas.ejs', {restipo: "success", resultado: "La venta ha sido registrada!", sales: result, sesion: req.session });
								}
							});
						}
					});
			}
			else {
				res.redirect("/makeSale")
			}
		});
	}
});


export default router;