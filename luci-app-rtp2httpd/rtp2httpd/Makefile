include $(TOPDIR)/rules.mk

PKG_NAME:=rtp2httpd
PKG_VERSION:=2.7.2
PKG_RELEASE:=1
PKG_MAINTAINER:=Stackie Jia <jsq2627@gmail.com>

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/stackia/rtp2httpd/tar.gz/v$(PKG_VERSION)?
PKG_HASH:=305283d030a65f27a87a8db76b049772b3e57a9c0859beec16af9b7f0905a69d
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)

define Build/Prepare
	$(call Build/Prepare/Default)
	if [ -d "$(PKG_BUILD_DIR)" ]; then \
		mv $(PKG_BUILD_DIR) $(PKG_BUILD_DIR).tmp && \
		mkdir -p $(PKG_BUILD_DIR) && \
		mv $(PKG_BUILD_DIR).tmp/* $(PKG_BUILD_DIR)/ && \
		rmdir $(PKG_BUILD_DIR).tmp; \
	fi	
endef

PKG_FIXUP:=autoreconf
PKG_INSTALL:=1

include $(INCLUDE_DIR)/package.mk

define Package/rtp2httpd
	SECTION:=net
	CATEGORY:=Network
	TITLE:=Convert multicast RTP/UDP IPTV streams into HTTP streams with FCC support
	URL:=https://github.com/stackia/rtp2httpd
	DEPENDS:=+libpthread
endef

define Package/rtp2httpd/description
	rtp2httpd converts multicast RTP/UDP media into http stream.
	It acts as a tiny HTTP server. When client connect,
	pre-configured multicast RTP service is choosen by URL.
	Program then join pre-configured multicast address and translate
	incoming RTP data to HTTP stream.
endef

CONFIGURE_ARGS += \
	--enable-optimization=-O3

define Package/rtp2httpd/conffiles
/etc/config/rtp2httpd
endef

define Package/rtp2httpd/install
	$(INSTALL_DIR) $(1)/etc/init.d $(1)/etc/config
	$(INSTALL_CONF) ./files/rtp2httpd.conf $(1)/etc/config/rtp2httpd
	$(INSTALL_BIN) ./files/rtp2httpd.init $(1)/etc/init.d/rtp2httpd
	$(INSTALL_DIR) $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/src/rtp2httpd $(1)/usr/bin
	$(INSTALL_CONF) $(PKG_BUILD_DIR)/rtp2httpd.conf $(1)/etc
endef

$(eval $(call BuildPackage,rtp2httpd))
