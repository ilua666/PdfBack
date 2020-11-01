const { Sequelize, Model, DataTypes, where } = require('sequelize');
const sequelize = new Sequelize('pdfback',"sequelize1","12345678",{host:"localhost", dialect:"mysql"});
fs = require('fs');
const util = require('util');
const { PDFDocument } = require('pdf-lib');
const { access } = require('fs');

const fontSize = 20;

class User extends Model{}
User.init({
    id:{
        type: DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement: true,
    },
    firstName: DataTypes.STRING(200),
    lastName: DataTypes.STRING(200),
    image: DataTypes.BLOB,
    pdf: DataTypes.BLOB,
},{
    sequelize,
    modelName: 'user',
    freezeTableName: true,
    timestamps:false,
});

async function pdfCreateForName(firstName){
    const users = await getUsersByName(firstName)
    const user = users[0];
    const promices = users.reduce((acc,curr)=> {
        acc.push(createPdf(curr));
        return acc;
    }, [])
    const res = await Promise.all(promices);
}

async function pdfCreateAndSave(firstName){
    const users = await getUsersByName(firstName)
    const user = users[0];
    const usersPdfPromises = users.reduce((acc,curr)=> {
        acc.push(createPdf(curr));
        return acc;
    }, [])
    const res = await Promise.all(usersPdfPromises);

    const fileSavePromises = res.reduce((acc,curr)=> {
        const fileName = `${curr.firstName}-${curr.id}.pdf`
        acc.push(replaceFile(fileName,curr.pdf));
        return acc;
    }, [])
    await Promise.all(fileSavePromises);
    //const fileName = `${user.firstName}-${user.id}.pdf`;
    //replaceFile(fileName, await createPdf(user).pdf);
}

async function getUsersByName(firstName){
    return await User.findAll({where:{firstName: firstName}});
}

async function createPdf(user){
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    page.moveTo(100, height - fontSize*2);
    page.drawText(user.firstName);
    page.moveDown(fontSize);
    page.drawText(user.lastName);
    const buff = new Uint8Array(user.image)
    const image = await pdfDoc.embedJpg(buff);
    page.moveTo(0, height- fontSize*4 - image.height);
    page.drawImage(image);
    const pdfBytes = await pdfDoc.save()
    const fileName = `${user.firstName}-${user.id}.pdf`
    return {
        id: user.id,
        firstName: user.firstName, 
        lastName: user.lastName, 
        image: user.image,
        pdf: pdfBytes};
}

async function replaceFile(fileName, buffer){
    await fs.unlink(fileName,()=>{});
    await fs.writeFile(fileName, buffer, () => {
        console.log(`${fileName} saved`);
    });
}

async function init(){
    await User.sync({ alter: true })
    await User.destroy({
        truncate: true
    });

    const asyncReadFile = util.promisify(fs.readFile)
    const data = await asyncReadFile("image.jpg");
    await User.create({firstName:"Ilya",lastName:"shibut", image:data});
    await User.create({firstName:"Ilya",lastName:"shibut2", image:data});
    await User.create({firstName:"Ilya",lastName:"shibut3", image:data});
    await User.create({firstName:"Ilya2",lastName:"shibut3", image:data});
    await User.create({firstName:"Ilya3",lastName:"shibut3", image:data});

}

if (require.main === module) {
    
   init().then(()=>{
       console.log("init done");
       //pdfCreateForName("Ilya");
       pdfCreateAndSave("Ilya");
   })
}