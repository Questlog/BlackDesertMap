package de.questlog.tables;

/**
 * Created by Benni on 30.03.2016.
 */
public class User {
    private int id;
    private String username;
    private String password;
    private String ts3id;

    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }


    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }


    public String getTs3id() {
        return ts3id;
    }
    public void setTs3id(String ts3id) {
        this.ts3id = ts3id;
    }
}
