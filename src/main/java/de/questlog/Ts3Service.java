package de.questlog;

import com.github.theholywaffle.teamspeak3.TS3Api;
import com.github.theholywaffle.teamspeak3.TS3Config;
import com.github.theholywaffle.teamspeak3.TS3Query;
import com.github.theholywaffle.teamspeak3.api.wrapper.Ban;
import com.github.theholywaffle.teamspeak3.api.wrapper.Client;
import com.github.theholywaffle.teamspeak3.api.wrapper.ClientInfo;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.ini4j.Ini;

import java.util.*;
import java.util.logging.Level;

/**
 * Created by Benni on 28.08.2015.
 */
public class Ts3Service implements Service {
    private static final Logger LOGGER = LogManager.getLogger(Ts3Service.class);

    private int[] groupIDs;
    private int port;
    private String botName;
    private String queryUsername;
    private String queryPassword;

    private final TS3Config ts3config = new TS3Config();
    private TS3Query ts3query;
    private TS3Api ts3api;

    private Map<String, ClientInfo> clientList = new HashMap<>();
    private List<String> bannedUids = new ArrayList<>();
    private long lastClientListScan = 0;

    public Ts3Service()  {

    }

    public class Ts3ServiceException extends Exception { }

    public class ClientNotFound extends Ts3ServiceException { }
    public class DidNotPassRequirements extends Ts3ServiceException { }
    public class WrongMessageToken extends Ts3ServiceException { }
    public class ClientIsBanned extends Ts3ServiceException { }
    public class ClientHasGroup extends Ts3ServiceException { }

    @Override
    public void readSettings(Ini settings) {
        Ini.Section general = settings.get("general");

        String ip = general.get("ip");
        LOGGER.info("IP: " + ip);

        port = general.get("port", Integer.class);
        LOGGER.info("Port: " + port);

        Integer queryPort = general.get("queryPort", Integer.class);
        LOGGER.info("queryPort: " + queryPort);

        queryUsername = general.get("queryUsername");
        LOGGER.info("QueryUsername: " + queryUsername);

        queryPassword = general.get("queryPassword");
        LOGGER.info("QueryPassword: ***");

        String floodRate = general.get("floodRate");
        LOGGER.info("FloodRate: " + floodRate);

        //groupID = general.get("groupId", Integer.class);
        //LOGGER.info("GroupId: " + groupID);
        groupIDs = general.getAll("groupIds", int[].class);
        LOGGER.info("GroupIds: " + Arrays.toString(groupIDs));

        botName = general.get("botName");
        LOGGER.info("BotName: " + botName);

        ts3config.setHost(ip);
        ts3config.setQueryPort(queryPort);
        ts3config.setFloodRate(TS3Query.FloodRate.valueOf(floodRate));
        ts3config.setDebugLevel(Level.WARNING);
        ts3config.setCommandTimeout(10*1000);

        ts3query = new TS3Query(ts3config);
        ts3api = ts3query.getApi();

//        connectionCount = requirements.get("connectionCount", Integer.class);
//        LOGGER.info("ConnectionCount: " + connectionCount);

//        daysSinceFirstConnection = requirements.get("daysSinceFirstConnection", Integer.class);
//        LOGGER.info("DaysSinceFirstConnection: " + daysSinceFirstConnection);
    }

    public void run() {
        ts3query.connect();

        if(queryUsername != null && queryPassword != null)
            ts3api.login(queryUsername, queryPassword);

        ts3api.selectVirtualServerByPort(port);
        ts3api.setNickname(botName);
        //refreshClientlist();
    }

    private synchronized void refreshClientlist(){
        if(lastClientListScan + 10000 > System.currentTimeMillis())
            return;

        LOGGER.info("Refreshing Clientlist");
        long timerStart = System.currentTimeMillis();
        List<Client> clients = ts3api.getClients();
        Map<String, ClientInfo> ids = new HashMap<String, ClientInfo>();

        StringJoiner sj = new StringJoiner(", ", "[", "]");
        for(Client c : clients){
            sj.add(c.getNickname());
            ClientInfo info = ts3api.getClientByUId(c.getUniqueIdentifier());
            ids.put(c.getUniqueIdentifier(), info);
        }

        List<Ban> bans = ts3api.getBans();
        List<String> bannedIds = new ArrayList<>();
        for(Ban b : bans)
            bannedIds.add(b.getBannedUId());

        float time = (System.currentTimeMillis() - timerStart)/1000;
        LOGGER.info( String.format("Refrest took %.2f seconds. Clients are: %s", time, sj.toString()));

        this.clientList = ids;
        this.bannedUids = bannedIds;
        lastClientListScan = System.currentTimeMillis();
    }

    public boolean checkid(String id) throws ClientNotFound, ClientIsBanned, ClientHasGroup, DidNotPassRequirements {
        //Check current userlist
        LOGGER.debug("Checking id: \"" + id + "\"");
        //refreshClientlist();

        Client client = ts3api.getClientByUId(id);
        if(client == null)
            throw new ClientNotFound();

        ClientInfo clientInfo = ts3api.getClientInfo(client.getId());
        if(clientInfo == null)
            throw new ClientNotFound();

        clientList.put(id, clientInfo);

        if(bannedUids.contains(id))
            throw new ClientIsBanned();

        int[] groups = clientInfo.getServerGroups();
        LOGGER.debug("Groups of client: " + Arrays.toString(groups));
        boolean hasGroup = false;
        for (int group : groups){
            if (ArrayUtils.contains(groupIDs, group)){
                hasGroup = true;
            }
        }
        if(!hasGroup)
            throw new DidNotPassRequirements();

//        if(clientInfo.getTotalConnections() < connectionCount)
//            throw new DidNotPassRequirements();

//        if(clientInfo.getCreatedDate().after(new Date(System.currentTimeMillis() - daysSinceFirstConnection * 24 * 60 * 1000)))
//            throw new DidNotPassRequirements();

        //LOGGER.debug(clientInfo.getType());
        //LOGGER.debug(clientInfo.isRegularClient());
        LOGGER.debug("ID is good");
        return true;
    }

    public boolean sendValidation(String id, String token) throws ClientNotFound {
        //refreshClientlist();

        LOGGER.info("Validating: " + id + ", Token = " + token);

        ClientInfo info = clientList.get(id);
        if(info == null)
            throw new ClientNotFound();

        ts3api.sendPrivateMessage(info.getId(), token);

        return true;
    }
}
