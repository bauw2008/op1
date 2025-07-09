# SPDX-License-Identifier: GPL-2.0-only
#
# Copyright (C) 2020 Lean <coolsnowwolf@gmail.com>
# Copyright (C) 2021-2023 ImmortalWrt.org

include $(TOPDIR)/rules.mk

PKG_NAME:=autocore
PKG_FLAGS:=nonshared
PKG_RELEASE:=6

PKG_CONFIG_DEPENDS:= \
	CONFIG_TARGET_bcm27xx \
	CONFIG_TARGET_bcm53xx \
	CONFIG_TARGET_x86

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/target.mk

define Package/autocore
  TITLE:=auto core loadbalance script.
  DEPENDS:=@(aarch64||arm||i386||i686||x86_64) \
    +TARGET_bcm27xx:bcm27xx-utils \
    +TARGET_bcm53xx:nvram \
    +TARGET_x86:ethtool \
    +TARGET_x86:lm-sensors
endef

define Build/Compile
endef

define Package/autocore/install
	$(INSTALL_DIR) $(1)/etc
	$(CP) ./files/status/10_system.js $(1)/etc/rpcd_10_system.js
	$(CP) ./files/status/20_memory.js $(1)/etc/rpcd_20_memory.js
	$(CP) ./files/status/30_network.js $(1)/etc/rpcd_30_network.js
	$(CP) ./files/luci/luci $(1)/etc/rpcd_luci
	$(CP) ./files/luci/luci-base.json $(1)/etc/rpcd_luci-base.json
	$(CP) ./files/base-files/banner $(1)/etc/rpcd_banner

	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/090-cover-index_files $(1)/etc/uci-defaults/

ifneq ($(filter i386 i686 x86_64, $(ARCH)),)
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/info/autocore $(1)/etc/init.d/
endif

	$(INSTALL_DIR) $(1)/sbin
	$(INSTALL_BIN) ./files/info/cpuinfo $(1)/sbin/
	$(INSTALL_BIN) ./files/info/getcpu $(1)/sbin/
ifneq ($(filter ipq% mediatek% qualcommax%, $(TARGETID)),)
	$(INSTALL_BIN) ./files/info/tempinfo $(1)/sbin/
endif

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(CP) ./files/luci/luci-mod-status-autocore.json $(1)/usr/share/rpcd/acl.d/
endef

$(eval $(call BuildPackage,autocore))

