package com.photostudio.manager.install;

import android.content.Context;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@CapacitorPlugin(name = "PsmInstall")
public class PsmInstallPlugin extends Plugin {

    private static final String APK_MIME = "application/vnd.android.package-archive";
    private static final char[] HEX_DIGITS = "0123456789abcdef".toCharArray();

    /**
     * Validates that the call targets an existing .apk strictly inside the
     * app cache directory. Rejects the call and returns null on any failure.
     */
    private File validatedApk(PluginCall call) {
        String path = call.getString("path");
        if (path == null || !path.endsWith(".apk")) {
            call.reject("path must point to an .apk file");
            return null;
        }
        File file = new File(path);
        if (!file.isAbsolute() || !file.isFile()) {
            call.reject("APK file not found");
            return null;
        }
        try {
            String cacheRoot = getContext().getCacheDir().getCanonicalPath();
            String canonical = file.getCanonicalPath();
            if (!canonical.startsWith(cacheRoot + File.separator)) {
                call.reject("APK must be inside the app cache directory");
                return null;
            }
            return file;
        } catch (IOException e) {
            call.reject("Unable to resolve APK path: " + e.getMessage());
            return null;
        }
    }

    @PluginMethod
    public void sha256(PluginCall call) {
        File file = validatedApk(call);
        if (file == null) {
            return;
        }
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            call.reject("SHA-256 unavailable: " + e.getMessage());
            return;
        }
        byte[] buffer = new byte[65536];
        try (FileInputStream in = new FileInputStream(file)) {
            int read;
            while ((read = in.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
        } catch (IOException e) {
            call.reject("Unable to read APK: " + e.getMessage());
            return;
        }
        byte[] hash = digest.digest();
        StringBuilder hex = new StringBuilder(hash.length * 2);
        for (byte b : hash) {
            hex.append(HEX_DIGITS[(b >> 4) & 0xF]).append(HEX_DIGITS[b & 0xF]);
        }
        JSObject result = new JSObject();
        result.put("hex", hex.toString());
        call.resolve(result);
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        File file = validatedApk(call);
        if (file == null) {
            return;
        }
        Context ctx = getContext();
        Uri uri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", file);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, APK_MIME);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            ctx.startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("No system installer available on this device");
        } catch (Exception e) {
            call.reject("Unable to launch the package installer: " + e.getMessage());
        }
    }
}
