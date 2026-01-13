# Cloudinary Security Configuration Guide

## 🔒 Is Unsigned Preset Safe?

**YES, but ONLY if you configure it correctly.**

Unsigned presets are safe for client-side uploads **IF** you lock them down with strict restrictions. Without restrictions, unsigned presets are a security risk.

---

## ✅ Required Cloudinary Preset Configuration

### Step 1: Create Upload Preset in Cloudinary Dashboard

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Navigate to **Settings > Upload**
3. Scroll to **"Upload presets"**
4. Click **"Add upload preset"**
5. Name: `event_images`

### Step 2: Configure Preset Settings (CRITICAL)

#### 🔴 Signing Mode
- **Select: "Unsigned"** ✅ (This is fine if restrictions below are set)

#### 🔴 Required Restrictions (NON-NEGOTIABLE)

**1. Resource Type:**
- ✅ Set to: **"Image"** only
- ❌ Do NOT allow: "Raw", "Video", "Auto"

**2. Allowed Formats:**
- ✅ Enable ONLY: `jpg`, `jpeg`, `png`, `webp`, `gif`
- ❌ Do NOT allow: `pdf`, `doc`, `exe`, `zip`, or any other formats

**3. Max File Size:**
- ✅ Set to: **5 MB** (5,242,880 bytes)
- This keeps you within free tier limits

**4. Folder Structure:**
- ✅ Set folder: `events/`
- This organizes uploads and prevents root-level clutter
- ❌ Do NOT allow arbitrary folders

**5. Transformation Settings:**
- ✅ Enable: **"Eager transformations"** (optional, for optimization)
- ✅ Set: `c_limit` (crop limit) to prevent abuse
- ✅ Set: `f_auto` (format auto) for optimization
- ✅ Set: `q_auto` (quality auto) for optimization

**6. Access Mode:**
- ✅ Set to: **"Public"** (for event images that need to be accessible)
- ❌ Do NOT use: "Authenticated" (unless you have specific needs)

**7. Overwrite:**
- ✅ Set to: **"Unique filename"** (prevents overwriting)
- OR: **"Deny"** (if you want to prevent overwrites)

**8. Tags (Optional but Recommended):**
- ✅ Add tag: `event-image`
- This helps with organization and cleanup

#### 🔴 Advanced Security Settings

**9. Allowed Transformation Parameters:**
- ✅ Limit to: `width`, `height`, `crop`, `quality`, `format`
- ❌ Do NOT allow: `fetch`, `url`, or other potentially dangerous transformations

**10. Moderation (Optional but Recommended):**
- ✅ Enable: **"Auto-moderation"** (if available in your plan)
- This can help detect inappropriate content

---

## 🛡️ Client-Side Validation (Implemented)

The application now includes client-side validation to prevent accidental uploads:

### ✅ File Type Validation
- Only allows: JPG, JPEG, PNG, WebP, GIF
- Rejects all other file types before upload

### ✅ File Size Validation
- Maximum: 5MB per file
- Rejects larger files before upload

### ✅ Quantity Limit
- Maximum: **1 image per event** (enforced in widget)
- Prevents multiple uploads

### ✅ URL Validation
- Verifies uploaded URL is from Cloudinary domain
- Prevents malicious URL injection

---

## ⚠️ What You Should NOT Do

### ❌ Do NOT Allow:
1. **Unlimited file sizes** - Will drain your bandwidth quota
2. **Raw files** - Security risk (could upload executables)
3. **Arbitrary folders** - Could lead to organization issues
4. **Multiple images per event** - Against your product spec (1 image per event)
5. **Unrestricted transformations** - Could be abused for resource consumption
6. **No file type restrictions** - Security vulnerability

---

## 📊 Free Tier Limits

Cloudinary Free Tier:
- **Storage:** 25 GB
- **Bandwidth:** 25 GB/month
- **Transformations:** 25,000/month

**With 1 image per event and 5MB max:**
- Max events per month: ~5,000 (if all have images)
- This is well within free tier for MVP

---

## 🔄 Migration from Unsigned to Signed (Future)

If you want to move to signed uploads later (more secure):

1. Change preset to **"Signed"**
2. Create API endpoint: `/api/cloudinary/sign`
3. Generate signature server-side using `CLOUDINARY_API_SECRET`
4. Update `CldUploadWidget` to use `signatureEndpoint`

**Current implementation:** Uses unsigned with strict restrictions (safe for MVP)

---

## ✅ Checklist

Before going to production, verify:

- [ ] Preset is set to "Unsigned"
- [ ] Resource type is "Image" only
- [ ] Allowed formats: jpg, jpeg, png, webp, gif only
- [ ] Max file size: 5MB
- [ ] Folder: `events/`
- [ ] Overwrite: "Unique filename" or "Deny"
- [ ] Client-side validation is working
- [ ] Test upload with valid image (should work)
- [ ] Test upload with invalid file type (should reject)
- [ ] Test upload with file > 5MB (should reject)
- [ ] Test upload with multiple files (should allow only 1)

---

## 🚨 Security Best Practices

1. **Monitor Usage:** Check Cloudinary dashboard regularly for unusual activity
2. **Set Alerts:** Configure bandwidth/storage alerts in Cloudinary
3. **Regular Cleanup:** Delete unused images periodically
4. **Rate Limiting:** Consider adding rate limiting to upload endpoint (future)
5. **Content Moderation:** Enable auto-moderation if available

---

## 📝 Summary

**Your current setup (unsigned preset) is SAFE if:**
- ✅ All restrictions above are configured
- ✅ Client-side validation is in place (now implemented)
- ✅ You monitor usage regularly

**Unsigned preset is DANGEROUS if:**
- ❌ No file type restrictions
- ❌ No size limits
- ❌ Raw files allowed
- ❌ No folder restrictions

**You're good to go!** The preset restrictions + client-side validation provide adequate security for an MVP.
