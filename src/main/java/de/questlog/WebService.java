package de.questlog;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.bson.Document;
import org.ini4j.Ini;
import spark.Request;
import spark.Response;
import spark.Session;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.apache.commons.codec.binary.Hex;

import java.util.*;

import static org.apache.commons.lang3.StringUtils.substring;
import static spark.Spark.*;

public class WebService implements Service {
    private static final Logger LOGGER = LogManager.getLogger(WebService.class);

    private Transactions tr = null;
    private String rootPath = null;
    private Ts3Service ts3Service;
    private Random random;

    Gson gson = new Gson();


    public WebService(Transactions tr, String rootPath, Ts3Service ts3Service) {
        this.tr = tr;
        this.rootPath = rootPath;
        this.random = new Random();
        this.ts3Service = ts3Service;
        staticFileLocation("static");
        externalStaticFileLocation(rootPath + "static");
    }


    @Override
    public void readSettings(Ini settings) {
        Ini.Section general = settings.get("general");

        int port = general.get("port", Integer.class);

        port(port);
        LOGGER.info("Port: " + port);
    }

    @Override
    public void run() {

        get("/mapobj", "application/json", this::getMapObj);
        get("/mapobj/:type", "application/json", this::getMapObj);
        get("/mapobj/:type/:id", "application/json", this::getMapObj);

        before("/mapobj/:type", this::checkLogin);
        post("/mapobj/:type", "application/json", this::postMapObj);
        put("/mapobj/:type", "application/json", this::putMapObj);
        delete("/mapobj/:type", "application/json", this::deleteMapObj);

        before("/auth/*", ((request, response) -> response.type("application/json")));
        get("/auth/loggedIn", this::loggedIn, gson::toJson);
        post("/auth/login", "application/x-www-form-urlencoded", this::login, gson::toJson);
        post("/auth/logout", this::logout, gson::toJson);
        post("/auth/register", "application/x-www-form-urlencoded", this::register, gson::toJson);
        get("/auth/checkid",  this::checkTs3Id, gson::toJson);
        get("/auth/validate",  this::validate, gson::toJson);
    }

    private JsonElement logout(Request req, Response res){
        req.session(true).attribute("authenticated", false);
        req.session().invalidate();
        return status("ok");
    }

    private boolean loggedIn (Request req, Response res) {
        Boolean authenticated = req.session(true).attribute("authenticated");
        if(authenticated == null)
            authenticated = false;
        return authenticated;
    }


    private JsonElement login (Request req, Response res) {
        Session session = req.session(true);

        /*
        //login without user/pass, just teamspeak auth
        Boolean validated = session.attribute("validated");
        String id = session.attribute("id");
        if(validated != null && validated && id != null){
            session.attribute("authenticated", true);
            return status("ok");
        }
        */

        String name = req.queryParams("name");
        String pass = req.queryParams("password");

        if(isNullOrEmpty(name) || isNullOrEmpty(pass))
            return status("MissingParameter");

        boolean exists = tr.userExists(name, getHash(pass));
        if(exists){
            session.attribute("authenticated", true);
            session.attribute("username", name);
            String userId = tr.getUserId(name);
            session.attribute("userId", userId);
            return status("ok");
        } else {
            return status("userNotFound");
        }
    }

    private boolean isNullOrEmpty(String s){
        return s == null || s.isEmpty();
    }

    /**
     * Registrating is like inserting and updating. if you are validated, you can insert a new account,
     * but if your ID already has one, it gets updated, like re-registered.
     */
    private JsonElement register(Request req, Response res){
        //TODO clean this mess of a function
        List<String> status = new ArrayList<>();

        //registration only with valid ts3 auth
        Session session = req.session(true);
        Boolean validated = session.attribute("validated");
        String id = session.attribute("id");
        if(validated == null || !validated || isNullOrEmpty(id)){
            status.add("ValidateFirst");
            return status(status);
        }



        String name = req.queryParams("name");
        String password = req.queryParams("password");
        String passwordConfirm = req.queryParams("passwordconfirm");

        boolean inputIsOk = true;
        if(isNullOrEmpty(name)) {
            inputIsOk = false;
            status.add("NoName");
        }

        if(isNullOrEmpty(password)) {
            inputIsOk = false;
            status.add("NoPassword");
        } else if(isNullOrEmpty(passwordConfirm)) {
            inputIsOk = false;
            status.add("NoPasswordConfirm");
        } else if(!password.equals(passwordConfirm)) {
            inputIsOk = false;
            status.add("InvalidConfirmation");
        }

        if(inputIsOk){
            String encryptedString = getHash(password);

            boolean userExists = tr.userExists(id);

            if(!userExists){
                try{
                    tr.addNewUser(id, name, encryptedString);
                    LOGGER.info("New User:\tID: " + id + " name: " + name );
                    status.add("ok");
                } catch (Transactions.DoesAlreadyExist e){
                    LOGGER.info(name + " already exists");
                    status.add("NameInUse");
                }
            } else {
                try {
                    tr.updateUser(id, name, encryptedString);
                    LOGGER.info("Update User:\tID: " + id + " name: " + name);
                    status.add("ok");
                } catch (Transactions.NotFound ignored) {}
                catch (Transactions.DoesAlreadyExist doesAlreadyExist) {
                    status.add("NameInUse");
                }
            }
        }
        return status(status);
    }

    private JsonElement status(Map<String, Object> attribs){
        return gson.toJsonTree(attribs);
    }

    private JsonElement status(List<String> attribs){
        return gson.toJsonTree(attribs);
    }

    private JsonElement status(String status){
        //TODO make this a class
        JsonObject json = new JsonObject();
        json.addProperty("status", status);
        return json;
    }

    private String getHash(String str){
        if(str == null)
            return null;

        MessageDigest messageDigest = null;
        try {
            messageDigest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        assert messageDigest != null;
        messageDigest.update(str.getBytes());
        return Hex.encodeHexString(messageDigest.digest());
    }



    /**
     * Step one: Validate Ts3ID
     *      GET / ?id=Ts3ID
     *      Request returns json:
     *          {"status": "ok"}
     *          or {"status": "TooManyTokenRequests"}
     *          or {"status": "ClientIsBanned"}
     *          or {"status": "DidNotPassRequirements"}
     *          or {"status": "ClientNotFound"}
     *          or {"status": "MissingParameter"}
     * Step two: validate(...)
     * @param req Spark Request
     * @param res Spark Response
     * @return JsonObject
     */
    private JsonElement checkTs3Id(Request req, Response res){
        res.type("application/json");
        Session session = req.session(true);
        String status = "";

        String id = req.queryParams("id");
        if(isNullOrEmpty(id))
            return status("MissingParameter");

        try{
            ts3Service.checkid(id);
            status = "ok";
            session.attribute("checked", true);
        }  catch (Ts3Service.Ts3ServiceException e) {
            status = e.getClass().getSimpleName();
            session.attribute("checked", false);
        }

        if(!testTokenRequestCount(session)){
            LOGGER.info("Too many token requests from: " + getIp(req));
            status = "TooManyTokenRequests";
            session.attribute("checked", false);
        }

        return status(status);
    }

    /**
     * Step two: Send token to Ts3User
     *      GET / ?id=Ts3ID
     *      Request returns json:
     *          {"status": "NotYetChecked"}
     *          or {"status": "ClientNotFound"}
     *          or {"status": "TooManyTokenRequests"}
     *          or {"status": "TokenIsSent"}
     * Step three: Validate Token
     *      GET / ?id=Ts3ID&token=Token
     *      Request returns json:
     *          {"status": "NotYetChecked"}
     *          or {"status": "TooManyTokenRequests"}
     *          or {"status": "WrongToken"}
     *          or {"status": "ok"}
     * @param req Spark Request
     * @param res Spark Response
     * @return JsonObject
     */
    private JsonElement validate(Request req, Response res){
        res.type("application/json");
        Session session = req.session(true);
        String status = "";

        String id = req.queryParams("id");
        String token = req.queryParams("token");
        session.attribute("valid", false);

        Boolean checked = session.attribute("checked");
        if(checked == null || !checked)
            return status("NotYetChecked");

        if(!testTokenRequestCount(session)){
            LOGGER.info("Too many token requests from: " + getIp(req));
            return status("TooManyTokenRequests");
        }
        int msgCounter = session.attribute("msgCounter");

        if(token == null) {
            try{
                token = getRandomToken();
                ts3Service.sendValidation(id, token);
                session.attribute("token", token);
                session.attribute("id", id);
                status = "TokenIsSent";
                session.attribute("msgCounter", msgCounter + 1);
            }  catch (Ts3Service.Ts3ServiceException e) {
                status = e.getClass().getSimpleName();
            }
        } else {
            if (token.equals(session.attribute("token"))
                    && id.equals(session.attribute("id"))) {
                status = "ok";
                session.attribute("validated", true);
            } else {
                status = "WrongToken";
                session.attribute("validated", false);
            }
        }
        return status(status);
    }

    /**
     * Generates a string with 32 random characters [0-9a-z]
     * @return a string with 32 random characters [0-9a-z]
     */
    private String getRandomToken() {
        return new BigInteger(130, random).toString(32);
    }

    /**
     * Checks if the client has requested too many tokens in the last two days
     * @param session Spark Session
     * @return true if everything is fine
     */
    private boolean testTokenRequestCount(Session session){
        long accessLength = System.currentTimeMillis() - session.lastAccessedTime();

        if( accessLength > 2*24*60*60*1000 ) //TODO make this a setting
            session.attribute("msgCounter", 0);

        Integer msgCounter = session.attribute("msgCounter");
        if(msgCounter == null){
            session.attribute("msgCounter", 0);
            msgCounter = 0;
        }
        return msgCounter <= 5;
    }

    /**
     * Tries to get the real IP of an user, even if he is behind a proxy
     * @param request Spark request
     * @return IP
     */
    private static String getIp(Request request) {
        String remoteAddr = request.ip();
        String x;
        if ((x = request.headers("X-Forwarded-For")) != null) {
            remoteAddr = x;
            int idx = remoteAddr.indexOf(',');
            if (idx > -1) {
                remoteAddr = remoteAddr.substring(0, idx);
            }
        }
        return remoteAddr;
    }




    private void checkLogin(Request req, Response res) {
        boolean loggedIn = loggedIn(req, res);

        if(!req.requestMethod().equals("GET") && !loggedIn)
            halt(401, "Not Authenticated!");
    }

    private String getMapObj(Request req, Response res){
        Boolean authenticated = req.session(true).attribute("authenticated");
        if(authenticated == null)
            authenticated = false;

        String type = req.params(":type");
        String id = req.params(":id");

        return gson.toJson(tr.getMarkers(authenticated, type, id));
    }

    private String postMapObj(Request req, Response res) {
        if(req.params(":type") == null)
            return "missing parameter";
        String marker = req.body();
        if (isNullOrEmpty(marker))
            return "missing parameter";

        String username = req.session().attribute("username");
        String userId = req.session().attribute("userId");

        try{
            LOGGER.debug("New Marker by " + username + "(" + userId + "): " + substring(marker, 0, 200));
            Document m = tr.addNewMarker(marker, username, userId);
            return gson.toJson(m);
        } catch (Transactions.TransactionException e) {
            return e.getClass().getSimpleName();
        }
    }

    private String putMapObj(Request req, Response res){
        if(req.params(":type") == null)
            return "missing parameter";
        String marker = req.body();
        if (isNullOrEmpty(marker))
            return "missing parameter";

        String username = req.session().attribute("username");
        String userId = req.session().attribute("userId");

        LOGGER.debug("Update Marker by " + username + "(" + userId + "): " + substring(marker, 0, 200));

        tr.updateMarker(marker, username, userId);
        return "ok";
    }

    private String deleteMapObj(Request req, Response res) {
        if (req.params(":type") == null) //TODO remove type parameter
            return "missing parameter";
        String marker = req.body();
        if (isNullOrEmpty(marker))
            return "missing parameter";

        String username = req.session().attribute("username");
        String userId = req.session().attribute("userId");

        LOGGER.debug("Remove Marker by " + username + "(" + userId + "): " + substring(marker, 0, 200));

        tr.deleteMarker(marker, username, userId);
        return "ok";
    }
}
