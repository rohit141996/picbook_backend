const express = require('express')
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const Account = require('./mdb/schema');
const Image = require('./mdb/Schema1');
const multer = require('multer')
const bodyParser = require('body-parser')
const fs = require('fs');
require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = process.env.PORT || 14563

app.listen(PORT, () => { console.log(`listening on ${PORT} Port`) })


//////////////////////////////////////////////////////

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage })


//////////////////////////////// LOGIN //////////////////////////////////////

app.post('/login', async (req, res) => {
    const data = req.body;
    const username = data.username;
    const password = data.password;
    const checker = await Account.findOne({ username: username });
    if (username && password !== '') {
        if (checker) {
            if ((checker.password) === (password)) {
                res.json(checker)
            } else {
                res.json({ error: 'incorrect password. please try again.' })
            }
        } else {
            res.json({ error: `no such username exists. create a new account or try again.` })
        }
    } else {
        res.json({ error: `make sure to fill password and username fields.` })
    }
})

/////////////////// CREATE ACCOUNT ///////////////////////////////////////////

app.post('/create_account', async (req, res) => {
    const data = req.body;
    const { username, password, email, name } = data
    const checker = await Account.findOne({ username: username })
    if (!checker) {
        if (username && password && email && name !== '') {
            await Account.insertMany(data);
            res.json({ message: `account created successfully. try logging in account.` })
        } else {
            res.json({ error: `make sure all the fields are filled` })
        }
    } else if (checker) {
        res.json({ error: `account with this username already exists. use different username.` })
    }
})

/////////////////////// UPLOAD PROFILE PICTURE /////////////////////////////////

app.post('/profilepic', upload.single('profilepic'), async (req, res) => {
    const username = req.body.username
    console.log(username);
    console.log(req.body)
    if (req.file.size < 104000) {
        const user = await Account.findOneAndUpdate({ username: username }, {
            profilepic: {
                name: req.file.filename,
                img: {
                    data: fs.readFileSync('./uploads/' + req.file.filename),
                    contentType: 'image/png'
                }
            }
        })
        const user1 = await Account.find({ username: username });
        res.json(user1)
    } else {
        res.json({ message: 'the size of the file is more than 100kb. try compressing the picture and upload again.' })
    }
})

/////////////////// UPDATE PROFILE /////////////////////////////////////////////

app.post('/update_profile', async (req, res) => {
    const data = req.body;
    const username = data.username;
    const name = data.name;
    const email = data.email;
    const password = data.password;
    const checker = await Account.findOne({ username: username });
    if (username && name && password && email !== '') {
        await Account.findOneAndUpdate({ username: username }, { email: email, password: password, name: name })
        const updated = await Account.findOne({ username: username })
        res.json(updated);
    } else {
        res.json({ error: 'make sure all the fields are filled' })
    }
})

////////////////////////// UPLOAD IMAGES //////////////////////////////////

app.post('/postupload', upload.single('postupload'), async (req, res) => {
    const username = req.body.username;
    if(req.file){
        if (req.file.size < 103424) {
            const asd = {
                name: req.file.filename,
                username: username,
                img: {
                    data: fs.readFileSync('./uploads/' + req.file.filename),
                    contentType: 'image/png'
                }
            }
            await Image.insertMany(asd).then(() => console.log(`uploaded bro`)).catch(e => console.log('there is an error'))
            res.json({ message: 'image is uploaded successfully' })
        } else {
            res.json({ error: 'image is bigger than 100kb. try compressing the image and upload again.' })
        }
    } else {
        res.json('please choose a file before pressing the uploading button')
    }
})

///////////////////// LOAD IMAGES ///////////////////////////////////////

app.post('/loadposts', async (req, res) => {
    const username = req.body.username;
    const data = await Image.find({ username: username });
    res.json(data)
})
///////////////// DELETING IMAGE/POST //////////////////////////////////////////////

app.post('/deletepost', async (req, res) => {
    const { name, username } = req.body;
    await Image.findOneAndDelete({ username: username, name: name });
    const data = await Image.find({ username: username });
    res.json(data)
})

/////////////////////////// SEARCHING FRIENDS //////////////////////////////////

app.post('/searchfriends', async (req, res) => {
    const data = req.body;
    const name = await data.friendSearch;
    const searched = await Account.find({ name: name })
    const searchedFriends = searched.map(element => {
        return ({
            name: element.name,
            username: element.username,
            email: element.email,
            friend: element.friend,
            friendreqsent: element.friendreqsent,
            friendreq: element.friendreq,
            online: element.online,
            profilepic: {
                name: element.profilepic.name,
                img: {
                    data: element.profilepic.img.data,
                    contentType: "image/png"
                }
            }
        })
    });
    res.json(searchedFriends)
})

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////// FRIEND REQUEST SYSTEM ///////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
////////// SENDING FRIEND REQUEST ////////////////////////////////

app.post('/sendfreq', async (req, res) => {
    const reciever = req.body.foundFriend;
    const sender = req.body.username
    let checker;
    const whetherAlreadyFriends = await Account.find({username: sender})
    whetherAlreadyFriends[0].friend.filter(elementeee=>{
        if(elementeee.username === reciever){
            checker = true
        }
    })
    let checker2;
    const ifFriendRequestExists = whetherAlreadyFriends[0].friendreq
    ifFriendRequestExists.filter(element=>{
        if(element.username === reciever){
            checker2 = true
        }
    })

    console.log(checker)
    if(checker2 === true){
        res.json('you have already recieved a friend request from this person. accept the request instead of sending new friend request.')
    } else {
        if(checker===true){
            res.json('this person is already in your friend list')
        } else {
            if (reciever !== sender){
                let authenticator = function (e) {
                    if (e.username === sender) {
                        return true
                    } else {
                        return false
                    };
                }
        
                const senderAccount = await Account.find({ username: sender })
                const recieverAccount = await Account.find({ username: reciever })
        
                const recieverFriendReq = recieverAccount[0].friendreq;
                const senderFriendReqSent = senderAccount[0].friendreqsent;
                
                if (recieverFriendReq.find(authenticator)) {
                    res.json({ message: 'you have already sent friend request to this person.' })
                } else {
                    if (senderAccount[0].profilepic) {
                        recieverFriendReq.push({
                            name: senderAccount[0].name,
                            email: senderAccount[0].email,
                            username: senderAccount[0].username,
                            profilepic: senderAccount[0].profilepic
                        })
                    } else if (!senderAccount[0].profilepic) {
                        recieverFriendReq.push({
                            name: senderAccount[0].name,
                            email: senderAccount[0].email,
                            username: senderAccount[0].username,
                        })
                    }
                    await Account.findOneAndUpdate({ username: reciever }, { friendreq: recieverFriendReq })
                    senderFriendReqSent.push(reciever)
                    await Account.findOneAndUpdate({ username: sender }, { friendreqsent: senderFriendReqSent })
                    res.json({ message: `friend request sent to '${reciever}'.` })
                }
            } else {
                res.json({ message: 'you cannot send friend request to yourself.' })
            }
        }
    }
})

////////////////// rejecting friend Request //////////////////////
//////////////////////////////////////////////////////////////////
app.post('/rejectfriendreq', async (req, res) => {
    const { username, reqSenderUsername } = req.body
    /////// finding FriendReqSender and deleting the name of reciever from sender's friendreqsent key////////////
    let reqSender = await Account.find({ username: reqSenderUsername })
    let deletingUsernameFromReqSent = reqSender[0].friendreqsent.filter(e => {
        return e !== username
    })
    reqSender[0].friendreqsent = deletingUsernameFromReqSent
    await Account.findOneAndUpdate({ username: reqSenderUsername }, { friendreqsent: deletingUsernameFromReqSent })
    //// finding FriendReqReciever and deleting friendReqSender's details from friendreq key of friendReqReciever /////////
    let reqReciever = await Account.find({ username: username })
    let remainingRequestsAfterDeletingExpectedRequest = reqReciever[0].friendreq.filter(e => { return e.username !== reqSenderUsername })
    reqReciever[0].friendreq = remainingRequestsAfterDeletingExpectedRequest
    const resulttt = await Account.findOneAndUpdate({ username: username }, { friendreq: remainingRequestsAfterDeletingExpectedRequest })
    res.json(resulttt)
})

//////////////// accepting friend request //////////////////////////
////////////////////////////////////////////////////////////////////
app.post('/acceptfriendreq', async (req, res) => {
    const { username, reqSenderUsername } = req.body
    let reqSender = await Account.find({ username: reqSenderUsername });
    let reqReciever = await Account.find({ username: username })
    ////////////adding friendReqReciever as friend in 'friend key' of friendReqSender /////
    let friendAdd = reqSender[0].friend
    friendAdd.push({
        name: reqReciever[0].name,
        username: reqReciever[0].username,
        email: reqReciever[0].email
    })
    await Account.findOneAndUpdate({ username: reqSenderUsername }, { friend: friendAdd })
    ///////////adding friendReqSender as friend in 'friend key' of friendReqReciever //////
    let friendAddPart2 = reqReciever[0].friend
    friendAddPart2.push({
        name: reqSender[0].name,
        username: reqSender[0].username,
        email: reqSender[0].email
    })
    await Account.findOneAndUpdate({ username: username }, { friend: friendAddPart2 })

    /////// finding FriendReqSender and deleting the name of reciever from sender's friendreqsent key////////////
    let reqSenderToDelete = await Account.find({ username: reqSenderUsername })
    let deletingUsernameFromReqSent = reqSenderToDelete[0].friendreqsent.filter(e => {
        return e !== username
    })
    reqSenderToDelete[0].friendreqsent = deletingUsernameFromReqSent
    await Account.findOneAndUpdate({ username: reqSenderUsername }, { friendreqsent: deletingUsernameFromReqSent })
    //// finding FriendReqReciever and deleting friendReqSender's details from friendreq key of friendReqReciever /////////
    let reqRecieverToDelete = await Account.find({ username: username })
    let remainingRequestsAfterDeletingExpectedRequest = reqRecieverToDelete[0].friendreq.filter(e => {
        return e.username !== reqSenderUsername
    })
    reqRecieverToDelete[0].friendreq = remainingRequestsAfterDeletingExpectedRequest
    await Account.findOneAndUpdate({ username: username }, { friendreq: remainingRequestsAfterDeletingExpectedRequest })

    const finalResult = await Account.find({ username: username })
    res.json(finalResult[0])
})

///////////////////// deleting friend ///////////////////////////////////////////////
app.post('/remove_friend', async(req, res)=>{
    const {ownUsername, specificFriendUsername} = req.body
    // deleting friend from own account's friend key
    const ownAccount = await Account.find({username: ownUsername})
    let deletingFriend = ownAccount[0].friend;
    let deletedFriend =  deletingFriend.filter(e=>{
        return e.username !== specificFriendUsername
    })
    const ownAccount1 = await Account.findOneAndUpdate({username: ownUsername}, {friend: deletedFriend})
    const ownAccount2 = await Account.find({username: ownUsername})

    // deleting own account details from friend's account's friend key 
    const friendAccount = await Account.find({username: specificFriendUsername})
    let deletingFriend1= friendAccount[0].friend;
    let deletedFriend1 = deletingFriend1.filter(e=>{
        return e.username !==ownUsername
    })
    const friendAccount1= await Account.findOneAndUpdate({username: specificFriendUsername}, {friend: deletedFriend1})
    console.log(ownAccount2)
        
    res.json(ownAccount2[0])
})

///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////


////////// opening friend's profile //////////////////////////////////////////
app.post('/friendprofile', async(req, res)=>{
    const {ownUsername, specificFriendUsername} = req.body;

    const friendAccount = await Account.find({username: specificFriendUsername});
    const {username, name, email} =friendAccount[0]

    const friendDetails = await Account.find({username: specificFriendUsername})
    
    let details;
    if(friendDetails[0].profilepic.img.data){
        details = {
            name: friendDetails[0].name,
            username: friendDetails[0].username,
            email: friendDetails[0].email,
            profilepic: friendDetails[0].profilepic,
        }
    } else {
        details = {
            name: friendDetails[0].name,
            username: friendDetails[0].username,
            email: friendDetails[0].email,
        }
    }
    
    const data = await Image.find({username: specificFriendUsername})

    const mainData = {data, details}

    res.json(mainData)
})











//app.post('/sendfreq', async (req, res) => {
//    const { reciever, sender } = req.body;
//    /////////// finding the reciever's account and adding the req in reciever's 'friendreq' key //////////
//    const reciever1 = await Account.find({ username: reciever });
//    if (reciever1[0].friendreq.includes(`${sender}`)) {
//        res.json('friend request is already sent to this person')
//    } else {
//        const reciever2 = reciever1[0].friendreq.concat(sender)
//        await Account.findOneAndUpdate({ username: reciever }, { friendreq: reciever2 })
//        ////// finding sender's account too and adding the req in the sender's 'friendreq' key ///////
//        const sender1 = await Account.find({ username: sender });
//        const sender2 = sender1[0].friendreqsent.concat(reciever)
//        await Account.findOneAndUpdate({ username: sender }, { friendreqsent: sender2 })
//        res.json({ message: `friend request sent to "${reciever}"` })
//    }
//})
