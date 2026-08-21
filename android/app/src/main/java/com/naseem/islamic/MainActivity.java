package com.naseem.islamic;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(AzanPlugin.class);
        registerPlugin(AutoUpdatePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
