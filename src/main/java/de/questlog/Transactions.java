package de.questlog;

import com.mongodb.*;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.DeleteResult;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;

import javax.print.Doc;
import java.util.*;

import static com.mongodb.client.model.Filters.*;


public class Transactions {
    private static final Logger LOGGER = LogManager.getLogger(Transactions.class);
    private MongoClient mongoClient;
    private MongoDatabase db;
    private MongoCollection<Document> userCollection;
    private MongoCollection<Document> markerCollection;


    public class TransactionException extends RuntimeException {}
    public class DoesAlreadyExist extends TransactionException {}
    public class NotFound extends TransactionException {}

    public Transactions(){
        this("bdomap");
    }

    public Transactions(String database) {
        mongoClient = new MongoClient();
        db = mongoClient.getDatabase(database);
        userCollection = db.getCollection("users");
        markerCollection = db.getCollection("markers");
    }

    public Transactions(MongoClient mongoClient, MongoDatabase db){
        this.mongoClient = mongoClient;
        this.db = db;
        userCollection = db.getCollection("users");
        markerCollection = db.getCollection("markers");
    }

    public List<Document> getMarkers(boolean isAuthenticated) {
        return getMarkers(isAuthenticated, null, null);
    }
    public List<Document> getMarkers(boolean isAuthenticated, String type) {
        return getMarkers(isAuthenticated, type, null);
    }
    public List<Document> getMarkers(boolean isAuthenticated, String type, String id) {
        List<Bson> query = new ArrayList<Bson>();

        if(!isAuthenticated){
            query.add(elemMatch("params",
                and(
                    eq("name", "authRequired"),
                    or(
                        eq("value", false),
                        eq("value", "")
                    )
                )
            ));
        }
        if(type != null)
            query.add(eq("type", type));
        if(id != null)
            query.add(eq("_id", new ObjectId(id)));

        query.add(or(
            exists("deleted", false),
            eq("deleted", false)
        ));

        List<Document> markers = markerCollection.find(and(query)).into(new ArrayList<Document>());

        for(Document m : markers){
            String _id = m.getObjectId("_id").toHexString();
            m.remove("_id");
            m.append("id", _id);
        }

        return markers;
    }

    public Document addNewMarker(String json, String userId, String username) throws DoesAlreadyExist {
        try {
            Document marker = Document.parse(json);
            Document audit = new Document();
            audit.append("createdBy", new Document("userid", userId).append("username", username));
            audit.append("createdAt", new Date());
            marker.append("audit", audit);
            markerCollection.insertOne(marker);
            String id = marker.getObjectId("_id").toHexString();
            marker.remove("_id");
            marker.append("id", id);
            return marker;
        } catch (MongoWriteException e) {
            LOGGER.debug(e);
            return null;
        }
    }

    public Document updateMarker(String json, String userId, String username)  {
        try {
            Document marker = Document.parse(json);
            ObjectId id = new ObjectId(marker.getString("id"));
            marker.remove("id");

            updateModifyAudit(marker, userId, username);

            markerCollection.replaceOne(eq("_id", id), marker);

            marker.append("id", id.toHexString());

            return marker;
        } catch (MongoWriteException e) {
            LOGGER.debug(e);
        }
        return null;
    }

    public void deleteMarker(String json, String userId, String username)  {
        Document marker = Document.parse(json);
        ObjectId id = new ObjectId(marker.getString("id"));
        updateModifyAudit(marker, userId, username);
        marker.append("deleted", true);
        markerCollection.replaceOne(eq("_id", id), marker);
    }
    public boolean userExists(String usernameOrTs3Id){
        return userExists(usernameOrTs3Id, null);
    }
    public boolean userExists(String usernameOrTs3Id, String passwordHash){
        Bson query = or (
                        eq("username", usernameOrTs3Id),
                        eq("ts3id", usernameOrTs3Id)
                );
        if(passwordHash != null)
            query = and(query, eq("password", passwordHash));

        FindIterable<Document> users = userCollection.find(query);

        return users.first() != null;
    }

    public Document addNewUser(String ts3id, String username, String password) throws DoesAlreadyExist {
        Document user = new Document("username", username);
        user.append("password", password);
        user.append("ts3id", ts3id);
        user.append("createdAt", new Date());

        try {
            userCollection.insertOne(user);
        }catch (MongoWriteException e){
            throw new DoesAlreadyExist();
        }

        return user;
    }


    public boolean updateUser(String ts3id, String username, String password) throws NotFound, DoesAlreadyExist {
        Document user = new Document();
        if(username != null)
            user.append("username", username);
        if(password != null)
            user.append("password", password);

        try {
            userCollection.updateOne(new Document("ts3id", ts3id), new Document("$set", user).append("$currentDate", new Document("modifiedAt", true)));
        }catch (MongoWriteException e){
            LOGGER.debug(e);
            throw new DoesAlreadyExist();
        }

        return true;
    }


    private void updateModifyAudit(Document doc, String userId, String username){

        Document audit = doc.get("audit", Document.class);
        if(audit == null)
            audit = new Document();
        audit.append("modifiedAt", new Date());
        audit.append("modifiedBy", new Document("userid", userId).append("username", username));
        doc.append("audit", audit);
    }

    public String getUserId(String username) throws NotFound{

        Document user = userCollection.find(new Document("username", username)).first();
        if(user == null)
            throw new NotFound();
        return user.getObjectId("_id").toHexString();
    }

}
