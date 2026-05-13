//requerimientos para la conexion
const { getDB } = require('../config/db');

const login = async (req, res)=>{
    //conexion a la base de datos
    try{
        const { nombre }= req.body; 

        const db = getDB();

        const usuario = await db.collection('usuarios').findOne({
            nombre: nombre
        });
        //comprobar usuario
        if(!usuario){
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        //si todo sale bien
        res.json({
            success: true,
            message: 'Login correcto',
            usuario: usuario
        });


    }catch(error){
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//exportar al login
module.exports = {
    login
}