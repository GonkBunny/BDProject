# BDProject

```
├───database
├──dbproj.js -> main
└───src
    ├───controllers -> functions (Brain), multiple js files if needed where we store functions
    │   └───index.controller.js 
    ├───models -> Classes
    │   └───User.js
    └───routes -> rotas no webbrowser disponiveis e que são encaminhadas para o brain
        └───index.js
```

# Para correr o servidor: 
```npm run dev <=> nodemon src/dbproj.js```

# Packages para instalar: 
.pg 
```npm i pg```
.express
```npm i express```
