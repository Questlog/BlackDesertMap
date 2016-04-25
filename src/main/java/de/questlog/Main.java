package de.questlog;

import org.apache.commons.lang3.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.ThreadContext;
import org.eclipse.jetty.util.log.Log;
import org.ini4j.Ini;
import org.ini4j.InvalidFileFormatException;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;

/**
 * Created by Benni on 19.03.2016.
 */
public class Main implements java.io.Closeable {
    private static final Logger LOGGER = LogManager.getLogger(Main.class);
    private Ts3Service ts3;
    private WebService web;

    private Thread ts3Thread;
    private Thread webThread;

    private EntityManagerFactory factory;
    private EntityManager entityManager;

    public static void main(String[] args) throws InterruptedException, IOException {
        LOGGER.debug("Hello World!");

        try (Main m = new Main()) {
            m.start();
            while (true)
                Thread.sleep(10);
        } catch (Exception e) {
            LOGGER.error(e);
        }

        LOGGER.debug("Goodbye");
    }

    private Main() throws Exception {
        String rootPath = getRootPath();

        try {
            LOGGER.info("Initializing Teamspeak Service");
            ts3 = new Ts3Service();

            LOGGER.info("Initializing Persistence");
            factory = Persistence.createEntityManagerFactory("h2-eclipselink");
            entityManager = factory.createEntityManager();

            LOGGER.info("Initializing Webservice");
            Transactions transactions = new Transactions(factory);
            web = new WebService(transactions, rootPath, ts3);

            LOGGER.info("Initializing done");

        } catch (Exception e) {
            LOGGER.error(e.getMessage(), e);
            //e.printStackTrace();
            close();
            throw e;
        }

        LOGGER.info("Reading Settings");
        try{
//            ClassLoader classloader = Thread.currentThread().getContextClassLoader();

            LOGGER.info("Ts3Service Settigs: " + rootPath + "Ts3.ini");
            Ini ts3Ini = new Ini();
            //ts3Ini.load(classloader.getResourceAsStream("Ts3.ini"));
            ts3Ini.load(new FileReader(new File(rootPath + "Ts3.ini")));
            ts3.readSettings(ts3Ini);

            LOGGER.info("WebService Settigs: " + rootPath + "WebService.ini");
            Ini webIni = new Ini();
            //webIni.load(classloader.getResourceAsStream("WebService.ini"));
            webIni.load(new FileReader(new File(rootPath + "WebService.ini")));
            web.readSettings(webIni);

        } catch (FileNotFoundException | NullPointerException e){
            LOGGER.error("Error reading Settings: File Not Found ", e);
            throw e;
        } catch (InvalidFileFormatException e){
            LOGGER.error("Error reading Settings: Invalid File Format", e);
            throw e;
        } catch (IOException e){
            LOGGER.error("Error reading Settings: General IOException", e);
            throw e;
        }
    }

    private void start() throws Exception{
        Thread Ts3Thread = new Thread(ts3);
        Thread WebThread = new Thread(web);

        LOGGER.info("Starting WebService");
        WebThread.start();

        LOGGER.info("Starting Ts3Service");
        Ts3Thread.start();
    }

    @Override
    public void close() throws IOException {
        LOGGER.info("Shutting down, closing persistence");
        if (entityManager != null) {
            entityManager.close();
        }
        if (factory != null) {
            factory.close();
        }
    }

    private static String getRootPath(){
        final File f = new File(Main.class.getProtectionDomain().getCodeSource().getLocation().getPath());
        String path = f.getAbsolutePath();
        if(f.isFile())
            path = f.getParent();

        if(System.getenv("bdomap_home") != null){
            path = System.getenv("bdomap_home");
            LOGGER.info("Using bdomap_home: " + path);
        }

        path = StringUtils.stripEnd(path, "/\\");
        path = path + File.separator;
        LOGGER.info("Root-Path: " + path);
        return path;
    }
}
