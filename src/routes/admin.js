var express = require('express');
var router = express.Router();

const bcrypt = require('bcrypt');
import client from './postgres';


router.get('/addUser', function (req, res) {
	if (req.session.loggedin && req.session.typeUser == 'administrador') {
		client.query("select rutpas, email from usuario", function (err, ress) {
			if (err) {
				res.redirect("/listUsers");
			} else {
				res.render('AgregarUsuario', { sesion: req.session, userExists: ress });
				res.end()
			}
		});
	} else {
		req.session.loggedin = false;
		res.render('Login', { restipo: "warning", resultado: "Sesión cerrada por actividad sin permisos " });
	}
});

router.get('/editUser', function (req, res) {
	if (req.session.loggedin && req.session.typeUser == 'administrador') {
		client.query('SELECT * FROM usuario WHERE rutpas = $1', [req.query.id], function (err, rs) {
			if (err) {
				throw err;
			} else {
				client.query("select rutpas, email from usuario where rutpas <> $1", [req.query.id], function (err, ress) {
					if (err) {
						res.redirect("/listUsers");
					} else {
						res.render('EditarUsuario.ejs', { userExists: ress, usuario: rs.rows[0], sesion: req.session });
						res.end();
					}
				});
			}
		});
	} else {
		req.session.loggedin = false;
		res.render('Login', { restipo: "warning", resultado: "Sesión cerrada por actividad sin permisos" });
		res.end();
	}
});

router.get('/blockUser', async function (req, res) {
	var sql = "SELECT * FROM usuario"
	var rs = await client.query(sql);
	if (req.session.loggedin && req.session.typeUser == 'administrador') {
		if (req.query.id == req.session.userID) {
			res.render('ListaUsers', { restipo: "warning", resultado: "No puedes bloquearte a tí mismo", users: rs, sesion: req.session });
		}
		else {

			client.query('UPDATE usuario SET estado = $2 WHERE rutpas = $1', [req.query.id, "blocked"], async function (err, ress) {
				rs = await client.query(sql);
				if (err) {
					res.render('ListaUsers', { restipo: "danger", resultado: "Error bloqueando al usuario", users: rs, sesion: req.session });
				}
				else {
					res.render('ListaUsers', { restipo: "success", resultado: "Se ha bloqueado al usuario.", users: rs, sesion: req.session });
				}
			});
		}

	} else {
		req.session.loggedin = false;
		res.render('Login', { restipo: "warning", resultado: "Sesión cerrada por actividad sin permisos" });
		res.end();
	}
});

router.get('/unblockUser', function (req, res) {

	if (req.session.loggedin && req.session.typeUser == 'administrador') {
		client.query('UPDATE usuario SET estado = $2 WHERE rutpas = $1', [req.query.id, "unblocked"], async function (err, ress) {
			var sql = "SELECT * FROM usuario"
			var rs = await client.query(sql);
			if (err) {
				res.render('ListaUsers', { restipo: "danger", resultado: "Error desbloqueando al usuario", users: rs, sesion: req.session });
			}
			else {
				res.render('ListaUsers', { restipo: "success", resultado: "Se ha desbloqueado al usuario.", users: rs, sesion: req.session });
			}
		});

	} else {
		req.session.loggedin = false;
		res.render('Login', { restipo: "warning", resultado: "Sesión cerrada por actividad sin permisos" });
		res.end();
	}
});

router.get('/listUsers', function (req, res, next) {
	if (req.session.loggedin && req.session.typeUser == 'administrador') {
		client.query('SELECT * FROM usuario', function (err, rs) {
			res.render('ListaUsers', { restipo: "success", resultado: "", users: rs, sesion: req.session });
		});
	} else {
		req.session.loggedin = false;
		res.render('Login', { restipo: "warning", resultado: "Sesión cerrada por actividad sin permisos" });
	}
});

router.get('/reportManag', async function (req, res) {
	if (req.session.loggedin && (req.session.typeUser == 'administrador')) {
		var sqlus = 'SELECT rutpas, nombrecompleto, tipo, email, telefono from usuario';
		var sqlpc = 'SELECT pr.codigo, pr.nombre, pr.marca, pr.stockmin, pr.stockact, pr.precio, pc.fechaelab, pc.fechavenc, pr.habilitado"disp" from producto pr, comestible pc where pr.codigo = pc.ccodigo';
		var sqlpnc = 'SELECT pr.codigo, pr.nombre, pr.marca, pr.stockmin, pr.stockact, pr.precio, pn.tipo2, pr.habilitado"disp" from producto pr, nocomestible pn where pr.codigo = pn.nccodigo';
		var sqlv = 'SELECT v.codigo, v.montototal, v.mediopago, v.fechaventa, count(pv.cantproductos)"cant" FROM ventas v, productoventas pv, producto pr WHERE pr.codigo = pv.codigop AND v.codigo = pv.codigov group by v.codigo';
		var sqlpv = 'SELECT pv.codigov, pr.nombre, pr.tipo, pv.cantproductos, pr.precio, (pv.cantproductos*pr.precio)"monto" FROM productoventas pv, producto pr WHERE pr.codigo = pv.codigop;'

		const res1 = await client.query(sqlus);
		const res2 = await client.query(sqlpc);
		const res3 = await client.query(sqlpnc);
		const res4 = await client.query(sqlv);
		const res5 = await client.query(sqlpv);

		res.render('Reportes', { sesion: req.session, users: res1, comestibles: res2, nocomestibles: res3, ventas: res4, prodvents: res5 });
	} else {
		req.session.loggedin = false;
		res.render('Login', { restipo: "warning", resultado: "Sesión cerrada por actividad sin permisos" });
	}
	res.end();
});


router.post('/addUser', async function (req, res) {
	try {
		var rut = req.body.rut;
		var pass = req.body.pwd;
		var hashpass = await bcrypt.hash(pass, 10)
		var nombre = req.body.name + " " + req.body.lname;
		var tipo = req.body.seleccion;
		var email = req.body.email;
		var fono = req.body.telefono;

		var rutExiste = await client.query('SELECT * FROM public.usuario WHERE rutpas = $1', [rut]);
		var emailExiste = await client.query('SELECT * FROM public.usuario WHERE email = $1', [email]);

		if (rutExiste.rows.length == 0 && emailExiste.rows.length == 0) {
			client.query("INSERT INTO public.usuario VALUES($1, $2, $3, $4, $5, $6, $7, $8)",
				[rut, hashpass, nombre, tipo, email, fono, "unblocked", pass], async function (err, resultsq2, fields) {
					var sql = "SELECT * FROM usuario"
					var rs = await client.query(sql);
					if (err) {
						res.render('ListaUsers', { restipo: "danger", resultado: "Error registrando al usuario", users: rs, sesion: req.session });
					}
					else {
						res.render('ListaUsers', { restipo: "success", resultado: "El usuario se ha registrado con éxito.", users: rs, sesion: req.session });
					}
				});

		}
		else {
			res.render('ListaUsers', { restipo: "warning", resultado: "El rut o el email del usuario ya existe.", users: rs, sesion: req.session });
		}
	}
	catch{
		res.render('Login', { restipo: "warning", resultado: "Sesión cerrada por actividad sin permisos" });
	}
});


router.post('/editUser', async function (req, res) {
	var rut = req.body.rut;
	var nombre = req.body.nombre;
	var email = req.body.email;
	var telefono = req.body.telefono;
	var oldtipo = req.body.oldtipo;
	var tipo = req.body.seleccion;
	var sql = "select count(tipo) from usuario where tipo = 'administrador'"
	var rsAdm = await client.query(sql);
	sql = "SELECT * FROM usuario"
	var rs = await client.query(sql);
	console.log(rsAdm.rows[0].count)
	console.log(oldtipo)
	console.log(tipo)
	if (rsAdm.rows[0].count == 1 && oldtipo == 'administrador' && tipo != oldtipo) {
		res.render('ListaUsers', { restipo: "warning", resultado: "Debe existir por lo menos un administrador", users: rs, sesion: req.session });
	}
	else {
		client.query('UPDATE public.usuario SET nombrecompleto = $2, tipo = $3, email = $4, telefono = $5 WHERE rutpas = $1',
			[rut, nombre, tipo, email, telefono], async function (err, resultsq1, fields) {
				var rs = await client.query(sql);
				if (req.session.userID == rut) {
					req.session.nameUser = nombre;
					if (tipo != 'administrador') {
						req.session.typeUser = tipo;
						res.render('Login', { restipo: "warning", resultado: "Se ha cerrado la sesión por cambio de tipo al usuario actual" });
					};
				}

				if (err) {
					res.render('ListaUsers', { restipo: "danger", resultado: "Error actualizando datos del usuario", users: rs, sesion: req.session });
				} else {
					res.render('ListaUsers', { restipo: "success", resultado: "El usuario se ha actualizado con éxito.", users: rs, sesion: req.session });
				}
			});
	}
});

export default router;