const { impersonateAccount, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers, deployments, getNamedAccounts} = require("hardhat");

const startImpersonating = async (address) => {
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address]
    });
    await hre.network.provider.send("hardhat_setBalance", [address, ethers.utils.parseEther("1000.0").toHexString().replace("0x0", "0x")]);
}

const stopImpersonating = async (address) => {
    await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [address]
    });
}

describe("LunchBox", () => {
    beforeEach(async () => {
        await deployments.fixture(['lunch_box_test_fixtures']);
        const accounts = await getNamedAccounts();
        recipient = accounts.recipient;
        [owner] = await ethers.getSigners();
        lunchBox = await ethers.getContractAt(
            "LunchBox", 
            (await deployments.get('LunchBox')).address
        );
        busd = await ethers.getContractAt(
            'MockToken',
            (await deployments.get('BUSD')).address
        );
        zoinks = await ethers.getContractAt(
            'Zoinks',
            (await deployments.get('Zoinks')).address
        );
        btc = await ethers.getContractAt(
            'MockToken',
            (await deployments.get('BTC')).address
        );
        eth = await ethers.getContractAt(
            'MockToken',
            (await deployments.get('ETH')).address
        );
        snacks = await ethers.getContractAt(
            'Snacks',
            (await deployments.get('Snacks')).address
        );
        btcSnacks = await ethers.getContractAt(
            'BtcSnacks',
            (await deployments.get('BtcSnacks')).address
        );
        ethSnacks = await ethers.getContractAt(
            'EthSnacks',
            (await deployments.get('EthSnacks')).address
        );
        router = await ethers.getContractAt(
            'IRouter',
            (await deployments.get('PancakeSwapRouter')).address
        );
        seniorage = await ethers.getContractAt(
            'Seniorage',
            (await deployments.get('Seniorage')).address
        );
        snacksPool = await ethers.getContractAt(
            'SnacksPool',
            (await deployments.get('SnacksPool')).address
        );
        poolRewardDistributor = await ethers.getContractAt(
            'PoolRewardDistributor',
            (await deployments.get('PoolRewardDistributor')).address
        );
        amountToStake = ethers.utils.parseEther("950");
        feeAmount = ethers.utils.parseEther("50");
        amountToBuyZoinks = ethers.utils.parseEther("100000");
        // Zoinks purchase
        await busd.approve(zoinks.address, amountToBuyZoinks);
        await zoinks.mint(amountToBuyZoinks);
        // Snacks purchase
        await zoinks.approve(snacks.address, amountToStake);
        await snacks.mintWithBuyTokenAmount(amountToStake.add(feeAmount));
        // BtcSnacks purchase
        await btc.approve(btcSnacks.address, amountToStake);
        await btcSnacks.mintWithBuyTokenAmount(amountToStake.add(feeAmount));
        // EthSnacks purchase
        await eth.approve(ethSnacks.address, amountToStake);
        await ethSnacks.mintWithBuyTokenAmount(amountToStake.add(feeAmount));
        // Seniorage impersonationg
        await startImpersonating(seniorage.address);
        seniorageSigner = await ethers.getSigner(seniorage.address);
        // SnacksPool impersonationg
        await startImpersonating(snacksPool.address);
        snacksPoolSigner = await ethers.getSigner(snacksPool.address);
    });

    it("Successful stake() execution by Seniorage (BUSD)", async() => {
        // Attempt to stake from owner
        await expect(lunchBox["stake(uint256)"](amountToStake))
            .to.be.revertedWith("LunchBox: caller is not the Seniorage contract");
        // Stake from Seniorage
        await busd.transfer(seniorage.address, amountToStake);
        await busd.connect(seniorageSigner).approve(lunchBox.address, amountToStake);
        await lunchBox.connect(seniorageSigner)["stake(uint256)"](amountToStake);
        // Check recipient balance
        expect(await busd.balanceOf(recipient)).to.equal(amountToStake);
        // Zero stake from Seniorage
        await lunchBox.connect(seniorageSigner)["stake(uint256)"](0);
    });

    it("Successful stake() execution by Seniorage (non BUSD currencies)", async() => {
        // Attempt to stake from owner
        await expect(lunchBox["stake(uint256,uint256,uint256,uint256,uint256,uint256)"]
            (amountToStake, amountToStake, amountToStake, amountToStake, amountToStake, amountToStake))
            .to.be.revertedWith("LunchBox: caller is not the Seniorage contract");
        // Stake from Seniorage
        await zoinks.transfer(seniorage.address, amountToStake);
        await btc.transfer(seniorage.address, amountToStake);
        await eth.transfer(seniorage.address, amountToStake);
        await snacks.transfer(seniorage.address, amountToStake);
        await btcSnacks.transfer(seniorage.address, amountToStake);
        await ethSnacks.transfer(seniorage.address, amountToStake);
        await zoinks.connect(seniorageSigner).approve(lunchBox.address, amountToStake);
        await btc.connect(seniorageSigner).approve(lunchBox.address, amountToStake);
        await eth.connect(seniorageSigner).approve(lunchBox.address, amountToStake);
        await snacks.connect(seniorageSigner).approve(lunchBox.address, amountToStake);
        await btcSnacks.connect(seniorageSigner).approve(lunchBox.address, amountToStake);
        await ethSnacks.connect(seniorageSigner).approve(lunchBox.address, amountToStake);
        await busd.mint(lunchBox.address, ethers.utils.parseEther("6"));
        await lunchBox.connect(seniorageSigner)
            ["stake(uint256,uint256,uint256,uint256,uint256,uint256)"]
            (amountToStake, amountToStake, amountToStake, amountToStake, amountToStake, amountToStake);
        // Check recipient balance
        expect(await busd.balanceOf(recipient)).to.equal(ethers.utils.parseEther("6"));
        // LunchBox impersonating
        await startImpersonating(lunchBox.address);
        const lunchBoxSigner = await ethers.getSigner(lunchBox.address);
        // Transfer all tokens from LunchBox
        const zoinksBalance = await zoinks.balanceOf(lunchBox.address);
        const btcBalance = await btc.balanceOf(lunchBox.address);
        const ethBalance = await eth.balanceOf(lunchBox.address);
        const snacksBalance = await snacks.balanceOf(lunchBox.address);
        const btcSnacksBalance = await btcSnacks.balanceOf(lunchBox.address);
        const ethSnacksBalance = await ethSnacks.balanceOf(lunchBox.address);
        await zoinks.connect(lunchBoxSigner).transfer(seniorage.address, zoinksBalance);
        await btc.connect(lunchBoxSigner).transfer(seniorage.address, btcBalance);
        await eth.connect(lunchBoxSigner).transfer(seniorage.address, ethBalance);
        await snacks.connect(lunchBoxSigner).transfer(seniorage.address, snacksBalance);
        await btcSnacks.connect(lunchBoxSigner).transfer(seniorage.address, btcSnacksBalance);
        await ethSnacks.connect(lunchBoxSigner).transfer(seniorage.address, ethSnacksBalance);
        // Zero stake from Seniorage
        await lunchBox.connect(seniorageSigner)
            ["stake(uint256,uint256,uint256,uint256,uint256,uint256)"]
            (0, 0, 0, 0, 0, 0);
        await stopImpersonating(lunchBox.address);
    });

    it("Successful stake() execution by SnacksPool", async() => {
        // Attempt to stake from owner
        await expect(lunchBox["stake(address,uint256,uint256,uint256)"]
            (owner.address, amountToStake, amountToStake, amountToStake))
            .to.be.revertedWith("LunchBox: caller is not the SnacksPool contract");
        // Stake from SnacksPool
        await snacks.transfer(snacksPool.address, amountToStake);
        await btcSnacks.transfer(snacksPool.address, amountToStake);
        await ethSnacks.transfer(snacksPool.address, amountToStake);
        await snacks.connect(snacksPoolSigner).approve(lunchBox.address, amountToStake);
        await btcSnacks.connect(snacksPoolSigner).approve(lunchBox.address, amountToStake);
        await ethSnacks.connect(snacksPoolSigner).approve(lunchBox.address, amountToStake);
        await busd.mint(lunchBox.address, ethers.utils.parseEther("6"));
        await lunchBox.connect(snacksPoolSigner)
            ["stake(address,uint256,uint256,uint256)"]
            (owner.address, amountToStake, amountToStake, amountToStake);
        // Check recipient/owner balances and totalSupply
        expect(await busd.balanceOf(recipient)).to.equal(ethers.utils.parseEther("6"));
        expect(await lunchBox.balances(owner.address)).to.equal(ethers.utils.parseEther("6"));
        expect(await lunchBox.totalSupply()).to.equal(ethers.utils.parseEther("6"));
        // LunchBox impersonating
        await startImpersonating(lunchBox.address);
        const lunchBoxSigner = await ethers.getSigner(lunchBox.address);
        // Transfer all tokens from LunchBox
        const snacksBalance = await snacks.balanceOf(lunchBox.address);
        const btcSnacksBalance = await btcSnacks.balanceOf(lunchBox.address);
        const ethSnacksBalance = await ethSnacks.balanceOf(lunchBox.address);
        await snacks.connect(lunchBoxSigner).transfer(seniorage.address, snacksBalance);
        await btcSnacks.connect(lunchBoxSigner).transfer(seniorage.address, btcSnacksBalance);
        await ethSnacks.connect(lunchBoxSigner).transfer(seniorage.address, ethSnacksBalance);
        // Zero stake from SnacksPool
        await lunchBox.connect(snacksPoolSigner)
            ["stake(address,uint256,uint256,uint256)"]
            (owner.address, 0, 0, 0);
            await stopImpersonating(lunchBox.address);
    });

    it("Successful getReward() execution", async() => {
        await lunchBox.connect(snacksPoolSigner).getReward(owner.address);
        // Stake from SnacksPool
        await snacks.transfer(snacksPool.address, amountToStake);
        await btcSnacks.transfer(snacksPool.address, amountToStake);
        await ethSnacks.transfer(snacksPool.address, amountToStake);
        await snacks.connect(snacksPoolSigner).approve(lunchBox.address, amountToStake);
        await btcSnacks.connect(snacksPoolSigner).approve(lunchBox.address, amountToStake);
        await ethSnacks.connect(snacksPoolSigner).approve(lunchBox.address, amountToStake);
        await busd.mint(lunchBox.address, ethers.utils.parseEther("6"));
        await lunchBox.connect(snacksPoolSigner)
            ["stake(address,uint256,uint256,uint256)"]
            (owner.address, amountToStake, amountToStake, amountToStake);
        // Notify LunchBox about reward
        await startImpersonating(poolRewardDistributor.address);
        const poolRewardDistributorSigner = await ethers.getSigner(poolRewardDistributor.address);
        await busd.transfer(lunchBox.address, amountToStake);
        await lunchBox.connect(poolRewardDistributorSigner).notifyRewardAmount(amountToStake);
        // Transfer ZOINKS to LunchBox (after swap balance)
        await zoinks.transfer(lunchBox.address, ethers.utils.parseEther("2"));
        await time.increase(84000);
        // Get reward
        await lunchBox.connect(snacksPoolSigner).getReward(owner.address);
        // Check balance
        const snacksReward = ethers.utils.parseEther("1766.79629925756985");
        expect(await snacks.balanceOf(owner.address)).to.equal(snacksReward);
    });
});