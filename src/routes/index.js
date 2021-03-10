const {Router} = require("express");
const router = Router();
const {getLeiloes,createUser,Login,criarLeilao,getLeiloesByKeyword, updateLeilao} = require("../controllers/index.controller");

//User
router.post('/dbproj/user', createUser);
router.put('/dbproj/user', Login);

//Leilão
router.post('/dbproj/leilao', criarLeilao);
router.put('/dbproj/leilao/:leilaoId',updateLeilao);

//Vários Leilões
router.get('/dbptoj/leiloes/:keyword',getLeiloesByKeyword);
router.get('/dbproj/leiloes',getLeiloes);

module.exports = router;

