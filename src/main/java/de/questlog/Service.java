package de.questlog;

import org.ini4j.Ini;

/**
 * Created by Benni on 28.08.2015.
 */
public interface Service extends Runnable{
    public void readSettings(Ini settings);
}
