const {Pool} = require("pg");
const {v4: uuidv4} = require("uuid");
require("dotenv-safe").config();
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const { notify } = require("../routes");

const poolConfig = {
      user: 'postgres',
      password: 'postgres',
      port: '5432',
      host: 'localhost',
      database: 'project'
}
const pool = new Pool(poolConfig)
pool.on('error', (error) => {
            console.log(`Pool error: ${error}`);
      })

function verifyJWT(req,res){
      const token = req.body['authToken'];
      if(!token){
            return -1;
      }
      var value = -2;
      jwt.verify(token,process.env.SECRET, function(err, decoded){
            if(err){
                  value = -2;
            }
            
            value = decoded.userid;
      });
      return value;
}

function scheduleLeilao(time,leilaoid){
      schedule.scheduleJob(date,async function () {
            //preciso de fazer a mensagem
      })
}



const getLeiloes = async (req,res)=>{
      //Ver autenticação se está logged in
      //Buscar todos os Leiloes ativos com o pg

      //Buscar a nova
      try{
            
            
            req.userid = verifyJWT(req,res);
            
            if(req.userid>=0){
                  const response = await pool.query('SELECT leilao.leilaoid, descricao_titulo.titulo, descricao_titulo.descricao, leilao.artigoid, leilao.datacomeco, leilao.datafim, leilao.utilizador_userid  FROM leilao,descricao_titulo WHERE descricao_titulo.leilao_leilaoid = leilao.leilaoid GROUP BY descricao_titulo.leilao_leilaoid,leilao.leilaoid HAVING MAX(datademudanca)=datademudanca;')
                  res.send(response.rows);
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'})
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'})
            }
            
            
            
      }catch(err){
            console.log("Empty");
      }
      console.log("Leiloes");
};

const createUser = async (req,res)=>{
      var max;
      try {
            max = await pool.query('SELECT max(userid) FROM utilizador;');
            if(max.rows){
                  max = BigInt(max.rows[0].max);
            }else{
                  max = BigInt(0);
            }
      } catch (error) {
            console.log(error);
            max = BigInt(0);
      }
      max = max +1n;
      const {username,email,password,admin} =  req.body;
      var adminBool;
      if(admin == "true"){
            adminBool = true;
      }else{
            adminBool = false;
      }
      try {
            const response = await pool.query('INSERT INTO utilizador (userid,username,email,password,admin,blocked) VALUES ($1,$2,$3,$4,$5,$6);',[max,username,email,password,adminBool,false]);
            console.log(response);
      } catch (error) {
            console.log(error)     
      }
      res.send("User created");
      
};

const Login = async (req,res)=>{
      const {username,password} = req.body;
      try {
            const response = await pool.query('SELECT userid FROM utilizador WHERE username=$1 AND password=$2',[username,password]);
            if(response.rows){
                  const userid = response.rows[0].userid;
                  const token = jwt.sign( { userid }, process.env.SECRET,{
                        expiresIn:500
                  } );
                  res.json({auth: true,authToken: token});
            }else{
                  res.json({erro: "AuthError"})
            }

      } catch (error) {
            console.log(error);  
      }

      
      console.log("Logged In");
      
}

const criarLeilao = async (req, res) => {
      //Por titulo
      var max;
      
      try {
            const {titulo,descricao,artigoid,minpreco,datacomeco,datafim} = req.body;
            req.userid = verifyJWT(req,res);
            
            if(req.userid>=0){
                  try {
                        
                  
                        max = await pool.query('SELECT max(leilaoid) FROM leilao;');
                        
                        if(max.rows){
                              max = BigInt(max.rows[0].max)+BigInt(1);
                        }else{
                              max = BigInt(0);
                        }
                  } catch (error) {
                        max = BigInt(0);     
                  }
                  try {
                        const timeStamp = new Date();
                        await pool.query('Begin Transaction;')
                        await pool.query('INSERT INTO leilao (leilaoid,artigoid,minpreco,datacomeco,datafim,utilizador_userid,cancelar) VALUES ($1,$2,$3,$4,$5,$6,DEFAULT);',[max,artigoid,minpreco,datacomeco,datafim,req.userid]);
                        await pool.query('INSERT INTO  descricao_titulo (descricao,titulo,datademudanca,leilao_leilaoid) VALUES ($1,$2,$3,$4);',[descricao,titulo,timeStamp,max]);
                        await pool.query('Commit;')
                        return res.json({leilaoId:parseInt(max)});
                  } catch (error) {
                        console.log(error);
                        return res.json({erro:error});
                        
                  }
                  
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'})
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'})
            }
            
      } catch (error) {
            console.log(error);
            return res.json({erro:error});
            
      }
      
      
}

const makeLicitation = async (req, res) =>{
      try{
            const leilaoid = BigInt(req.params.leilaoId);
            const licitacao = Number(req.params.licitacao);
            req.userid = verifyJWT(req,res);
            const date = new Date();
            
            if(req.userid>=0){
                  
                  await pool.query("Begin Transaction;");
                  const success = await pool.query('Select leilaoid,minpreco,datacomeco,datafim FROM leilao WHERE leilaoid = $1',[leilaoid]);
                  
                  
                        if(success.rows[0].datacomeco < date || date > success.rows[0].datafim){
                              console.log(success.rows[0].minpreco)
                              const success2 = await pool.query('Select * from licitacao WHERE utilizador_userid = $1', [req.userid]);
                              
                              
                              if(success.rows[0].minpreco < licitacao){
                                    if(Number(success2.rowCount) > 0){
                                          
                                          await pool.query('UPDATE licitacao SET datadalicitacao = $1,precodelicitacao = $2 WHERE utilizador_userid = $3;',[date,licitacao,req.userid]);
                                          
                                          await pool.query('UPDATE leilao SET minpreco = $1 WHERE leilaoid = $2',[licitacao,leilaoid]);
                                          
                                          await pool.query('Commit;');
                                          
                                    }else{
                                          await pool.query('INSERT INTO licitacao (datadalicitacao, precodelicitacao,utilizador_userid,leilao_leilaoid) VALUES ($1,$2,$3,$4);',[date,licitacao,req.userid,leilaoid]);
                                          await pool.query('UPDATE leilao SET minpreco = $1 WHERE leilaoid = $2',[licitacao,leilaoid]);
                                          await pool.query('Commit;');
                                          
                                    }
                                    // Mandar mensagem a todos os users que foram ultrapassados
                                    return res.json({success:"Licitação aconteceu"});
                              }else{
                                    await pool.query('Rollback;');
                                    return res.json({erro:"A licitação tem de ser maior"});
                              }
                        }else{
                              await pool.query('Rollback;');
                              return res.json({erro:"Fora da altura"});
                        }
                  
                  
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'});
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'});
            }
      }catch(err){
            await pool.query('Rollback;');
            return res.json({erro:err});
      }
      return res.json({erro:"Not valid user. Login Again"});

}

const getLeilaoByID = async (req, res)=>{
      //Meter a verificação que fez login
      const number = BigInt(req.params.leilaoId);
      const response = await pool.query('SELECT leilao.leilaoid, descricao_titulo.titulo, descricao_titulo.descricao, leilao.artigoid, leilao.datacomeco, leilao.datafim, leilao.utilizador_userid  FROM leilao,descricao_titulo WHERE descricao_titulo.leilao_leilaoid = leilao.leilaoid AND leilaoid = $1 GROUP BY descricao_titulo.leilao_leilaoid,leilao.leilaoid HAVING MAX(datademudanca)=datademudanca;',[number]);
      res.json(response.rows);
}


const insertMural = async (req, res) =>{
      try{
            const leilaoid = BigInt(req.params.leilao_leilaoid);
            const texto = String(req.params.texto);
            req.userid = verifyJWT(req,res);
            
            if(req.userid>=0){
                  
                  try {
                        const date = new Date();
                        //await pool.query('Begin Transaction;'); // pretty sure this isnt needed here
                        await pool.query('INSERT INTO mural (texto,datetime,leilao_leilao_id,utilizador_userid) VALUES ($1,$2,$3,$4);',[texto, date, leilaoid,req.userid]);
                        //await pool.query('Commit;') // pretty sure this isnt needed here
                        const message= "Nova mensagem no mural da eleicao "+ leilaoid;
                        const people = await pool.query('SELECT DISTINCT utilizador_userid FROM mural WHERE leilao_leilaoid = $1 AND utilizador_userid != $2',[leilaoid,req.userid]);
                        people.forEach(element => {
                              notifyPerson(element.utilizador_userid, message,date);
                        });
                        return res.json({success:message});
                  } catch (error) {
                        console.log(error);
                        return res.json({erro:error});
                        
                  }
                  
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'})
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'})
            }

            
      } catch (error) {
            console.log(error);
            return res.json({erro:error});
            
      }
      
      
}

/* notifica o userid de uma nova mensagem no mural */
function notifyPerson(userid,message,date){
      try {
            await pool.query('INSERT INTO mensagem (texto,utilread,notifdate,utilizador_userid) VALUES ($1,$2,$3,$4);',[message, false, date, userid]);
      } catch (error) {
            console.log(error);
            // idk how to handle the error
      }
}




const getLeiloesByKeyword = async (req,res) =>{
      //Meter a verificação que fez login
      req.params.keyword = req.params.keyword.split("&").join(" ");
      var number = parseInt(req.params.keyword);
      if(isNaN(number)){
            number = -1;
      }
      number = BigInt(number)
      const response = await pool.query('SELECT leilao.leilaoid, descricao_titulo.descricao FROM leilao, descricao_titulo WHERE leilao.leilaoid = descricao_titulo.leilao_leilaoid AND (descricao_titulo.descricao=$1 OR artigoid=$2)',[req.params.keyword,number])
      return res.json(response.rows);
}

//acabar
const updateLeilao = async (req,res) =>{
      const timeStamp = new Date();
      try {
            const leilaoid = BigInt(req.params.leilaoId);
            const {titulo,descricao} = req.body;
            req.userid = verifyJWT(req,res);
            if(req.userid>=0){
                  await pool.query("Begin Transaction")
                  const resp =await pool.query('SELECT utilizador_userid FROM leilao WHERE leilao.leilaoid =  $1',[leilaoid]);
                  if(resp.rows[0].utilizador_userid == BigInt(req.userid)){
                        await pool.query('INSERT INTO  descricao_titulo (descricao,titulo,datademudanca,leilao_leilaoid) VALUES ($1,$2,$3,$4);',[descricao,titulo,timeStamp,req.userid]);
                        await pool.query('Commit;')
                        return res.json({leilaoId:leilaoid});
                  }
                  return res.json({erro:"Not the vendor"});
                  
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'});
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'});
            }
      }catch(err){
            await pool.query('Rollback;');
            return res.json({erro:err});
      }

}





const schedule = async (req, res, id) =>{
      const sucess = await pool.query('SELECT datafim FROM leilao WHERE leilaoid = $1;',[id]);
      if(sucess.rows[0].datafim > new Date()){
            const s1 = await pool.query('UPDATE ')
      }
}


//acabar 
const getStatistic = async (req, res)=>{

      req.userid = verifyJWT(req,res);
            
            if(req.userid>=0){
                  const user = await pool.query('SELECT admin FROM utilizador WHERE userid=$1',[req.userid]);
                  if(user.rows[0].admin){
                        const answer = await pool.query('SELECT ')
                  }else{
                        return res.json({auth:false, message: 'You are not admin'});
                  }
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'})
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'})
            }

}


module.exports ={
      createUser,
      getLeiloes,
      Login,
      criarLeilao,
      getLeiloesByKeyword,
      updateLeilao,
      makeLicitation,
      getLeilaoByID,
      insertMural
}