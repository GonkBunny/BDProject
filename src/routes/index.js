const {Router} = require("express");
const router = Router();
const {getLeiloes,createUser,Login,criarLeilao,getLeiloesByKeyword, updateLeilao, getLeilaoByID,makeLicitation} = require("../controllers/index.controller");

//User
router.post('/dbproj/user', createUser);
router.put('/dbproj/user', Login);

//Leilão
router.post('/dbproj/leilao', criarLeilao);
router.put('/dbproj/leilao/:leilaoId',updateLeilao);
router.get('/dbproj/leilao/:leilaoId',getLeilaoByID);
router.get('/dbproj/leilao/:leilaoId/:licitacao',makeLicitation)



//Vários Leilões

router.get('/dbproj/leiloes',getLeiloes);
router.get('/dbproj/leiloes/:keyword',getLeiloesByKeyword);



module.exports = router;

