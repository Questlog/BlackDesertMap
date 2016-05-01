package de.questlog.test;


import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.util.JSON;
import de.questlog.Transactions;
import de.questlog.tables.Marker;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

public class TestTransactions {

    private static final Logger LOGGER = LogManager.getLogger(TestTransactions.class);

    static Transactions tr;

    @BeforeClass
    public static void setup(){

        MongoClient mongoClient = new MongoClient();
        MongoDatabase db = mongoClient.getDatabase("test");
        MongoCollection<Document> userCollection = db.getCollection("users");
        MongoCollection<Document> markerCollection = db.getCollection("markers");

        userCollection.drop();
        markerCollection.drop();

        userCollection.createIndex(new Document("username", 1), new IndexOptions().unique(true));
        userCollection.createIndex(new Document("ts3id", 1), new IndexOptions().unique(true));

        tr = new Transactions(mongoClient, db);
    }

    @Test
    public void testInsertUser(){
        tr.addNewUser("tsid1", "name1", "pass");
        boolean userExists = tr.userExists("tsid1");
        assertTrue(userExists);
        userExists = tr.userExists("name1");
        assertTrue(userExists);
    }

    @Test(expected = Transactions.DoesAlreadyExist.class)
    public void testInsertDuplicateUser(){
        tr.addNewUser("tsid2", "name2", "pass");
        tr.addNewUser("tsid3", "name2", "pass");
    }

    @Test(expected = Transactions.NotFound.class)
    public void testGetUser(){
        tr.addNewUser("tsid4", "name3", "pass");
        String userid = tr.getUserId("name3");
        assertNotNull(userid);
        tr.getUserId("fdjkgshdfgh");
    }

    @Test
    public void testInsertMarker(){
        Document user = tr.addNewUser("testInsertMarker", "testInsertMarker", "pass");
        String markerJson = "{ \"type\" : \"treasureChest\", \"authRequired\" : true, \"geojson\" : { \"type\" : \"Feature\", \"properties\" : {}, \"geometry\" : { \"type\" : \"Point\", \"coordinates\" : [ 20.775390625, 41.185546875, null ] } }, \"params\" : [ { \"name\" : \"authRequired\", \"label\" : \"Benötigt login\", \"element\" : \"input\", \"type\" : \"checkbox\", \"value\" : true, \"placeholder\" : \"\", \"options\" : [ \"authRequired\" ], \"defaultValue\" : \"\", \"optional\" : false } ] }";

        Document marker = tr.addNewMarker(markerJson, user.getObjectId("_id").toHexString(), "testInsertMarker");

        assertNotNull(marker);
        assertNotNull(marker.getString("id"));
    }

    @Test
    public void testUpdateMarker(){
        Document user = tr.addNewUser("testUpdateMarker", "testUpdateMarker", "pass");
        String userId = user.getObjectId("_id").toHexString();

        String markerJson = "{ \"type\" : \"treasureChest\", \"authRequired\" : true, \"geojson\" : { \"type\" : \"Feature\", \"properties\" : {}, \"geometry\" : { \"type\" : \"Point\", \"coordinates\" : [ 20.775390625, 41.185546875, null ] } }, \"params\" : [ { \"name\" : \"authRequired\", \"label\" : \"Benötigt login\", \"element\" : \"input\", \"type\" : \"checkbox\", \"value\" : true, \"placeholder\" : \"\", \"options\" : [ \"authRequired\" ], \"defaultValue\" : \"\", \"optional\" : false } ] }";

        tr.addNewMarker(markerJson, userId, "testUpdateMarker");
        Document marker = tr.getMarkers(true).get(0);

        Document updated = tr.updateMarker(marker.toJson(), userId, "testUpdateMarker");

        Document audit = updated.get("audit", Document.class);

        assertNotNull(audit.getDate("modifiedAt"));
        assertNotNull(audit.get("modifiedBy"));
        assertEquals(marker.getString("id"), updated.getString("id"));
    }

    @Test
    public void testGetMarkerByID(){
        Document user = tr.addNewUser("testGetMarkerByID", "testGetMarkerByID", "pass");
        String userId = user.getObjectId("_id").toHexString();

        String markerJson = "{ \"type\" : \"treasureChest\", \"authRequired\" : true, \"geojson\" : { \"type\" : \"Feature\", \"properties\" : {}, \"geometry\" : { \"type\" : \"Point\", \"coordinates\" : [ 20.775390625, 41.185546875, null ] } }, \"params\" : [ { \"name\" : \"authRequired\", \"label\" : \"Benötigt login\", \"element\" : \"input\", \"type\" : \"checkbox\", \"value\" : true, \"placeholder\" : \"\", \"options\" : [ \"authRequired\" ], \"defaultValue\" : \"\", \"optional\" : false } ] }";

        tr.addNewMarker(markerJson, userId, "testUpdateMarker");

        List<Document> markers = tr.getMarkers(true);
        assertTrue(markers.size() >= 1);
        Document marker = markers.get(0);

        String markerId = marker.getString("id");

        markers = tr.getMarkers(true, null, markerId);
        assertTrue(markers.size() == 1);
        assertEquals(markerId, marker.getString("id"));
    }

}
